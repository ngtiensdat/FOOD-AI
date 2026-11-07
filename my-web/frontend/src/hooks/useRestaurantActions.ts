// Mục đích: Quản lý trạng thái và các hành động chính của đối tác (Merchant Hub) bao gồm món ăn, chi nhánh và giờ mở cửa.
// Ý nghĩa: Tách biệt logic quản lý thực đơn và thông tin nhà hàng của đối tác ra khỏi tầng UI hiển thị.
// Chức năng đặc biệt: Cập nhật giờ mở cửa với định dạng hợp lệ, thay đổi trạng thái hoạt động nhà hàng (mở/đóng cửa), quản lý thực đơn theo chi nhánh.
// Design Pattern: Custom Hook pattern, Service abstraction.
// Biến, hàm đặc biệt: useRestaurantActions, toggleRestaurantStatus, updateProfileHours, handleSubmit, handleConfirmDelete.

'use client';

import { useState, useEffect } from 'react';
import { foodService } from '@/services/food.service';
import { restaurantService } from '@/services/restaurant.service';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { isValidOpeningHours } from '@/utils/helpers';
import { User } from '@/types/user';
import { Food } from '@/types/food';
import { Restaurant, UpdateRestaurantInput } from '@/types/restaurant';
import { foodSchema } from '@/schemas/food.schema';
import { FoodFormData } from '@/components/features/food/FoodFormModal';

export const useRestaurantActions = (user: User | Partial<User> | null | undefined) => {
  const [myFoods, setMyFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'ai-history' | 'categories' | 'vouchers' | 'views' | 'interactions' | 'conversion' | 'activity' | 'staff' | 'inventory' | 'staff-list' | 'staff-waiting' | 'staff-history' | 'staff-review' | 'inventory-ingredients' | 'inventory-recipes' | 'inventory-logs' | 'tables' | 'tables-list' | 'tables-bulk' | 'pos-terminals' | 'history'>('overview');
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isRestaurantActive, setIsRestaurantActive] = useState<boolean>(true);
  const [myBranches, setMyBranches] = useState<Restaurant[]>([]);

  const [formData, setFormData] = useState({
    name: '', price: '', description: '', image: '', tags: '', address: '', mapUrl: '', lat: '', lng: '', restaurantId: '', categoryId: '',
    calories: '', carbs: '', protein: '', fat: ''
  });

  const fetchMyFoods = async () => {
    setLoading(true);
    try {
      setMyFoods(await foodService.getMyFoods());
    } catch (error) {
      console.error(LABELS.UI_MESSAGES.RESTAURANT.LOAD_FOODS_ERROR, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurant = async () => {
    try {
      const res = await restaurantService.getMyRestaurant();
      if (res) {
        setRestaurant(res);
        setIsRestaurantActive(!!res.isActive);
      }
    } catch (error) {
      console.error(LABELS.UI_MESSAGES.RESTAURANT.LOAD_RESTAURANT_ERROR, error);
    }
  };

  const fetchMyBranches = async () => {
    try {
      const res = await restaurantService.getMyBranches();
      if (res) {
        setMyBranches(res);
      }
    } catch (error) {
      console.error(LABELS.UI_MESSAGES.RESTAURANT.LOAD_BRANCHES_ERROR, error);
    }
  };

  const toggleRestaurantStatus = async () => {
    const nextVal = !isRestaurantActive;
    setIsRestaurantActive(nextVal); // Optimistic UI update
    const ok = await restaurantService.updateRestaurantStatus(nextVal);
    if (ok) {
      toast.success(
        nextVal
          ? LABELS.RESTAURANT.STATUS_OPEN_SUCCESS
          : LABELS.RESTAURANT.STATUS_CLOSE_SUCCESS
      );
    } else {
      setIsRestaurantActive(!nextVal); // Revert
      toast.error(LABELS.RESTAURANT.STATUS_UPDATE_ERROR);
    }
  };

  const updateProfileHours = async (openingHours: string) => {
    if (openingHours && openingHours.trim()) {
      if (!isValidOpeningHours(openingHours)) {
        toast.error(LABELS.RESTAURANT.HOURS_FORMAT_ERROR);
        return;
      }
    }

    const ok = await restaurantService.updateRestaurantProfile({ openingHours });
    if (ok) {
      toast.success(LABELS.RESTAURANT.HOURS_UPDATE_SUCCESS);
      await fetchRestaurant();
    } else {
      toast.error(LABELS.RESTAURANT.HOURS_UPDATE_ERROR);
    }
  };

  const updateRestaurantProfile = async (data: UpdateRestaurantInput) => {
    const ok = await restaurantService.updateRestaurantProfile(data);
    if (ok) {
      toast.success(LABELS.SETTINGS.PROFILE.SAVE_SUCCESS);
      await fetchRestaurant();
      return true;
    } else {
      toast.error(LABELS.COMMON.ERROR);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMyFoods();
      fetchRestaurant();
      fetchMyBranches();
    }
  }, [user]);

  const handleOpenAdd = () => {
    setEditingFood(null);
    const defaultBranch = myBranches[0];
    setFormData({
      name: '',
      price: '',
      description: '',
      image: '',
      tags: '',
      address: defaultBranch ? defaultBranch.address || '' : '',
      mapUrl: defaultBranch ? defaultBranch.mapUrl || '' : '',
      lat: defaultBranch ? defaultBranch.latitude?.toString() || '' : '',
      lng: defaultBranch ? defaultBranch.longitude?.toString() || '' : '',
      restaurantId: defaultBranch ? defaultBranch.id.toString() : '',
      categoryId: '',
      calories: '',
      carbs: '',
      protein: '',
      fat: ''
    });
    setIsAddingFood(true);
  };

  const handleOpenEdit = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      price: food.price.toString(),
      description: food.description || '',
      image: food.image || '',
      tags: food.tags?.join(', ') || '',
      address: food.address || '',
      mapUrl: food.mapUrl || '',
      lat: food.lat?.toString() || '',
      lng: food.lng?.toString() || '',
      restaurantId: food.restaurantId?.toString() || '',
      categoryId: food.categoryId?.toString() || '',
      calories: food.calories?.toString() || '',
      carbs: food.carbs?.toString() || '',
      protein: food.protein?.toString() || '',
      fat: food.fat?.toString() || ''
    });
    setIsAddingFood(true);
  };

  const handleSelectBranch = (branchId: number) => {
    const selected = myBranches.find(b => b.id === branchId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        restaurantId: branchId.toString(),
        address: selected.address || '',
        mapUrl: selected.mapUrl || '',
        lat: selected.latitude?.toString() || '',
        lng: selected.longitude?.toString() || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        restaurantId: '',
        address: '',
        mapUrl: '',
        lat: '',
        lng: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent, overrides?: Partial<FoodFormData>) => {
    e.preventDefault();
    const currentData = {
      ...formData,
      ...(overrides
        ? {
            ...overrides,
            price: overrides.price !== undefined ? String(overrides.price) : formData.price,
            restaurantId: overrides.restaurantId !== undefined ? String(overrides.restaurantId) : formData.restaurantId,
            categoryId: overrides.categoryId !== undefined ? String(overrides.categoryId ?? '') : formData.categoryId,
            calories: overrides.calories !== undefined ? String(overrides.calories) : formData.calories,
            carbs: overrides.carbs !== undefined ? String(overrides.carbs) : formData.carbs,
            protein: overrides.protein !== undefined ? String(overrides.protein) : formData.protein,
            fat: overrides.fat !== undefined ? String(overrides.fat) : formData.fat,
            image: overrides.image !== undefined ? String(overrides.image) : formData.image,
            tags: overrides.tags !== undefined ? String(overrides.tags) : formData.tags,
          }
        : {})
    };
    if (!currentData.restaurantId) {
      toast.error(LABELS.UI_MESSAGES.RESTAURANT.SELECT_REQUIRED);
      return;
    }

    const priceParsed = parseFloat(currentData.price);
    const restaurantIdParsed = parseInt(currentData.restaurantId);
    const categoryIdParsed = currentData.categoryId ? parseInt(currentData.categoryId) : null;
    const tagsParsed = currentData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
    
    const caloriesParsed = currentData.calories ? parseFloat(currentData.calories) : null;
    const carbsParsed = currentData.carbs ? parseFloat(currentData.carbs) : null;
    const proteinParsed = currentData.protein ? parseFloat(currentData.protein) : null;
    const fatParsed = currentData.fat ? parseFloat(currentData.fat) : null;

    const validation = foodSchema.safeParse({
      name: currentData.name,
      price: priceParsed,
      description: currentData.description,
      image: currentData.image,
      tags: tagsParsed,
      restaurantId: restaurantIdParsed,
      categoryId: categoryIdParsed,
      calories: caloriesParsed,
      carbs: carbsParsed,
      protein: proteinParsed,
      fat: fatParsed,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    const data = {
      ...currentData,
      price: priceParsed,
      lat: currentData.lat ? parseFloat(String(currentData.lat)) : null,
      lng: currentData.lng ? parseFloat(String(currentData.lng)) : null,
      tags: tagsParsed,
      restaurantId: restaurantIdParsed,
      categoryId: categoryIdParsed || undefined,
      calories: caloriesParsed,
      carbs: carbsParsed,
      protein: proteinParsed,
      fat: fatParsed,
    };

    try {
      const ok = editingFood
        ? await foodService.updateFood(editingFood.id, data)
        : await foodService.createFood(data);

      if (ok) {
        toast.success(editingFood ? LABELS.RESTAURANT.SAVE_SUCCESS_EDIT : LABELS.RESTAURANT.SAVE_SUCCESS_ADD);
        setIsAddingFood(false);
        setEditingFood(null);
        fetchMyFoods();
      } else {
        toast.error(LABELS.COMMON.ERROR);
      }
    } catch (error) {
      toast.error(LABELS.COMMON.ERROR);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId !== null) {
      if (await foodService.deleteFood(deleteConfirmId)) {
        fetchMyFoods();
      }
      setDeleteConfirmId(null);
    }
  };

  return {
    myFoods,
    loading,
    activeTab,
    setActiveTab,
    isAddingFood,
    setIsAddingFood,
    editingFood,
    formData,
    setFormData,
    showMenu,
    setShowMenu,
    myBranches,
    restaurant,
    isRestaurantActive,
    deleteConfirmId,
    setDeleteConfirmId,
    fetchMyFoods,
    actions: {
      handleOpenAdd,
      onEdit: handleOpenEdit,
      onDelete: handleDelete,
      onConfirmDelete: handleConfirmDelete,
      handleSubmit,
      toggleRestaurantStatus,
      updateProfileHours,
      updateRestaurantProfile,
      handleSelectBranch
    }
  };
};
