import { useState, useEffect, useMemo } from 'react';
import { foodService } from '@/services/food.service';
import { restaurantService } from '@/services/restaurant.service';
import { voucherService } from '@/services/voucher.service';
import { orderService } from '@/services/order.service';
import { categoryService, CategoryGroup, Category } from '@/services/category.service';
import { tableService, DiningTable } from '@/services/table.service';
import { toast } from '@/store/useToastStore';
import { User, UserRole } from '@/types/user';
import { Restaurant } from '@/types/restaurant';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
  stock: number;
}

export interface PosFoodItem {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  image?: string | null;
  tags?: string[];
  stock: number; // Giả lập hoặc mặc định
  categoryId?: number | null;
  restaurantId?: number | null;
}

interface UsePosParams {
  user: User | Partial<User> | null;
}

export function usePos({ user }: UsePosParams) {
  const [branches, setBranches] = useState<Restaurant[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  
  const [allFoods, setAllFoods] = useState<PosFoodItem[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  
  // Table states
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableCarts, setTableCarts] = useState<Record<number, CartItem[]>>({});
  
  // Category filter states
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Voucher verify/apply states
  const [voucherCode, setVoucherCode] = useState('');
  const [verifyingVoucher, setVerifyingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountValue: string;
    title: string;
    discountAmount: number;
  } | null>(null);

  const [submittingOrder, setSubmittingOrder] = useState(false);
  
  // Fetch branches for RESTAURANT role
  useEffect(() => {
    if (!user) return;
    
    if (user.role === UserRole.RESTAURANT) {
      const fetchBranches = async () => {
        try {
          const res = await restaurantService.getMyBranches();
          setBranches(res || []);
          if (res && res.length > 0) {
            setSelectedBranchId(res[0].id);
          }
        } catch (e) {
          console.error('Lỗi khi tải chi nhánh:', e);
          toast.error('Không thể tải danh sách chi nhánh');
        }
      };
      fetchBranches();
    } else if (user.role === UserRole.STAFF && user.restaurantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedBranchId(user.restaurantId);
    }
  }, [user]);

  // Fetch foods and categories when branch changes
  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchMenuAndCategories = async () => {
      setLoadingMenu(true);
      try {
        // 1. Lấy tất cả món ăn của quán từ foodService
        const foodsRes = await foodService.getMyFoods();
        // Gán stock giả lập là 99 cho mỗi món
        const mappedFoods: PosFoodItem[] = (foodsRes || []).map((f: any) => ({
          ...f,
          stock: 99, // Mặc định tồn kho là 99
        }));
        setAllFoods(mappedFoods);

        // 2. Lấy phân cấp danh mục từ categoryService
        const catsRes = await categoryService.getPublicHierarchy(selectedBranchId);
        setCategoryGroups(catsRes || []);
        
        // Reset category filter khi đổi chi nhánh
        setActiveGroupId(null);
        setActiveCategoryId(null);

        // 3. Lấy bàn ăn của quán
        const tablesRes = await tableService.getTables(selectedBranchId);
        setTables(tablesRes || []);

        // Reset selected table
        setSelectedTableId(null);
        setTableCarts({});
      } catch (e) {
        console.error('Lỗi khi tải menu/danh mục POS:', e);
        toast.error('Không thể tải thông tin thực đơn của quán');
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenuAndCategories();
  }, [selectedBranchId]);

  // Lọc món ăn theo chi nhánh, tìm kiếm và phân loại danh mục
  const filteredMenu = useMemo(() => {
    // Lọc theo chi nhánh được chọn trước
    let result = allFoods.filter((item) => item.restaurantId === selectedBranchId);

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }

    // Lọc theo danh mục
    if (activeCategoryId !== null) {
      // Lọc chính xác theo categoryId
      result = result.filter((item) => item.categoryId === activeCategoryId);
    } else if (activeGroupId !== null) {
      // Lọc theo tất cả category thuộc group được chọn
      const currentGroup = categoryGroups.find((g) => g.id === activeGroupId);
      if (currentGroup) {
        const subCatIds = (currentGroup.categories || []).map((c) => c.id);
        // Bao gồm cả trường hợp món ăn gán trực tiếp vào Group (nếu backend cho phép gán categoryId = groupId)
        // hoặc món ăn thuộc các sub-category con.
        result = result.filter(
          (item) =>
            item.categoryId !== null &&
            item.categoryId !== undefined &&
            (subCatIds.includes(item.categoryId) || item.categoryId === activeGroupId)
        );
      }
    }

    return result;
  }, [allFoods, selectedBranchId, searchQuery, activeGroupId, activeCategoryId, categoryGroups]);

  // Load table cart when selectedTableId changes
  useEffect(() => {
    if (selectedTableId !== null) {
      setCart(tableCarts[selectedTableId] || []);
    } else {
      setCart([]);
    }
    setVoucherCode('');
    setAppliedVoucher(null);
  }, [selectedTableId]);

  const setTableStatusOnServer = async (tableId: number, status: 'FREE' | 'OCCUPIED') => {
    try {
      await tableService.updateTable(tableId, { status });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    } catch (e) {
      console.error(`Lỗi cập nhật trạng thái bàn ${tableId} sang ${status}:`, e);
    }
  };

  const handleSelectTable = async (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Chỉ chọn bàn, không tự động đặt OCCUPIED nếu giỏ hàng rỗng
    setSelectedTableId(tableId);
  };

  const handleReleaseTable = async (tableId: number) => {
    try {
      await setTableStatusOnServer(tableId, 'FREE');
      
      setTableCarts(prev => {
        const copy = { ...prev };
        delete copy[tableId];
        return copy;
      });

      if (selectedTableId === tableId) {
        setSelectedTableId(null);
        setCart([]);
      }
      toast.success('Bàn ăn đã được trả thành công.');
    } catch (e) {
      toast.error('Không thể trả bàn ăn');
    }
  };

  const handleTransferTable = async (toTableId: number) => {
    if (selectedTableId === null) {
      toast.error('Vui lòng chọn bàn ăn hiện tại trước');
      return;
    }
    const toTable = tables.find(t => t.id === toTableId);
    if (!toTable || toTable.status !== 'FREE') {
      toast.error('Bàn đích phải đang ở trạng thái Trống');
      return;
    }

    try {
      await tableService.transferTable({
        fromTableId: selectedTableId,
        toTableId,
      });

      // Di chuyển giỏ hàng
      const fromCart = tableCarts[selectedTableId] || [];
      setTableCarts((prev) => {
        const copy = { ...prev };
        copy[toTableId] = fromCart;
        delete copy[selectedTableId];
        return copy;
      });

      // Cập nhật state tables local
      const fromId = selectedTableId;
      setTables((prev) =>
        prev.map((t) => {
          if (t.id === fromId) return { ...t, status: 'FREE' };
          if (t.id === toTableId) return { ...t, status: 'OCCUPIED' };
          return t;
        })
      );

      // Chuyển sang bàn mới
      setSelectedTableId(toTableId);
      toast.success(`Đã đổi bàn thành công sang ${toTable.name}.`);
    } catch (e) {
      console.error('Lỗi chuyển bàn:', e);
      toast.error('Không thể chuyển bàn ăn');
    }
  };

  // Handlers for cart
  const addToCart = (food: PosFoodItem) => {
    if (selectedTableId === null) {
      toast.error('Vui lòng chọn bàn ăn trước khi đặt món');
      return;
    }
    if (food.stock <= 0) {
      toast.error(`Món "${food.name}" đã hết hàng!`);
      return;
    }

    // Nếu giỏ hàng hiện tại đang trống, tự động chiếm bàn
    const currentTableCart = tableCarts[selectedTableId] || [];
    if (currentTableCart.length === 0) {
      setTableStatusOnServer(selectedTableId, 'OCCUPIED');
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === food.id);
      let newCart;
      if (existing) {
        if (existing.quantity >= food.stock) {
          toast.error(`Không thể thêm! Tồn kho tối đa chỉ còn ${food.stock} phần.`);
          return prev;
        }
        newCart = prev.map((item) =>
          item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        newCart = [...prev, { id: food.id, name: food.name, price: food.price, image: food.image, quantity: 1, stock: food.stock }];
      }
      setTableCarts(tc => ({ ...tc, [selectedTableId!]: newCart }));
      return newCart;
    });
  };

  const updateCartQuantity = (foodId: number, delta: number) => {
    if (selectedTableId === null) return;
    setCart((prev) => {
      const newCart = prev
        .map((item) => {
          if (item.id === foodId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.stock) {
              toast.error(`Vượt quá số lượng tồn kho còn lại (${item.stock})`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      setTableCarts(tc => ({ ...tc, [selectedTableId!]: newCart }));
      
      // Nếu sau khi update giỏ hàng rỗng, tự động giải phóng bàn
      if (newCart.length === 0) {
        setTableStatusOnServer(selectedTableId!, 'FREE');
      }
      return newCart;
    });
  };

  const removeFromCart = (foodId: number) => {
    if (selectedTableId === null) return;
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== foodId);
      setTableCarts(tc => ({ ...tc, [selectedTableId!]: newCart }));
      
      // Nếu sau khi xóa giỏ hàng rỗng, tự động giải phóng bàn
      if (newCart.length === 0) {
        setTableStatusOnServer(selectedTableId!, 'FREE');
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setVoucherCode('');
    setAppliedVoucher(null);
    if (selectedTableId !== null) {
      setTableCarts(tc => {
        const copy = { ...tc };
        delete copy[selectedTableId];
        return copy;
      });
      // Tự động giải phóng bàn
      setTableStatusOnServer(selectedTableId, 'FREE');
    }
  };

  // Cart statistics
  const cartTotals = useMemo(() => {
    const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);
    const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    
    let discountAmount = 0;
    if (appliedVoucher) {
      const val = appliedVoucher.discountValue;
      if (val.includes('%')) {
        const percent = Number(val.replace(/[^0-9]/g, '')) || 0;
        discountAmount = (subtotal * percent) / 100;
      } else {
        discountAmount = Number(val.replace(/[^0-9]/g, '')) || 0;
      }
    }
    
    const total = Math.max(0, subtotal - discountAmount);
    return { totalItems, subtotal, discountAmount, total };
  }, [cart, appliedVoucher]);

  // Verify and Apply Voucher from customer loyalty points
  const handleVerifyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVerifyingVoucher(true);
    try {
      const res = await voucherService.verifyVoucher(voucherCode.trim());
      if (res && res.isValid) {
        const voucher = res.details;
        
        let minSpendValue = 0;
        if (voucher.minSpend) {
          minSpendValue = Number(voucher.minSpend.replace(/[^0-9]/g, '')) || 0;
        }

        if (cartTotals.subtotal < minSpendValue) {
          toast.error(`Hóa đơn chưa đạt mức chi tiêu tối thiểu để áp dụng Voucher này (Yêu cầu tối thiểu: ${voucher.minSpend})`);
          setVerifyingVoucher(false);
          return;
        }

        let discountVal = 0;
        if (voucher.discountValue.includes('%')) {
          const percent = Number(voucher.discountValue.replace(/[^0-9]/g, '')) || 0;
          discountVal = (cartTotals.subtotal * percent) / 100;
        } else {
          discountVal = Number(voucher.discountValue.replace(/[^0-9]/g, '')) || 0;
        }

        setAppliedVoucher({
          code: voucherCode.trim(),
          title: voucher.title,
          discountValue: voucher.discountValue,
          discountAmount: discountVal,
        });
        toast.success(`Đã áp dụng Voucher thành công! Giảm ${voucher.discountValue}`);
      } else {
        toast.error(res.reason || 'Voucher không hợp lệ hoặc không áp dụng được cho cửa hàng này.');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Lỗi kiểm tra voucher:', e);
      toast.error(e?.message || 'Không thể kiểm tra voucher');
    } finally {
      setVerifyingVoucher(false);
    }
  };

  const handleCancelVoucher = () => {
    setVoucherCode('');
    setAppliedVoucher(null);
  };

  // Submit Order (giả lập thanh toán & cập nhật stock cục bộ)
  const handleCreateOrder = async () => {
    if (cart.length === 0 || !selectedBranchId || selectedTableId === null) return;
    
    setSubmittingOrder(true);
    try {
      // 1. Gửi API tạo Order thật lên Server
      const payload = {
        restaurantId: selectedBranchId,
        tableId: selectedTableId,
        voucherCode: appliedVoucher?.code || undefined,
        subtotal: cartTotals.subtotal,
        discount: cartTotals.discountAmount,
        total: cartTotals.total,
        items: cart.map((item) => ({
          foodId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      await orderService.createOrder(payload);

      toast.success('Thanh toán thành công và đã trừ tồn kho nguyên liệu thô!');
      
      // Cập nhật tồn kho cục bộ trong state allFoods
      setAllFoods((prev) =>
        prev.map((item) => {
          const cartItem = cart.find((c) => c.id === item.id);
          if (cartItem) {
            return { ...item, stock: Math.max(0, item.stock - cartItem.quantity) };
          }
          return item;
        })
      );

      // Gọi API sử dụng voucher thực tế của dự án để đánh dấu voucher đã dùng trên server (nếu có)
      if (appliedVoucher) {
        try {
          await voucherService.applyVoucher(appliedVoucher.code);
        } catch (err) {
          console.warn('Lỗi đồng bộ sử dụng voucher lên server:', err);
        }
      }

      // Giải phóng bàn ăn trên server và local state
      const tableId = selectedTableId;
      await tableService.updateTable(tableId, { status: 'FREE' });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'FREE' } : t));

      // Xoá giỏ hàng của bàn này
      setTableCarts(prev => {
        const copy = { ...prev };
        delete copy[tableId];
        return copy;
      });

      setSelectedTableId(null);
      setCart([]);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Lỗi khi gửi đơn hàng:', e);
      toast.error(e?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    categoryGroups,
    activeGroupId,
    setActiveGroupId,
    activeCategoryId,
    setActiveCategoryId,
    loadingMenu,
    searchQuery,
    setSearchQuery,
    filteredMenu,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotals,
    voucherCode,
    setVoucherCode,
    verifyingVoucher,
    appliedVoucher,
    handleVerifyVoucher,
    handleCancelVoucher,
    submittingOrder,
    handleCreateOrder,
    tables,
    selectedTableId,
    setSelectedTableId,
    handleSelectTable,
    handleReleaseTable,
    handleTransferTable,
  };
}
