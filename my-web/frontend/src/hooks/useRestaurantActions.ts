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

export const useRestaurantActions = (user: User | Partial<User> | null | undefined) => {
  const [myFoods, setMyFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'ai-history' | 'categories' | 'vouchers' | 'views' | 'interactions' | 'conversion' | 'activity'>('overview');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.restaurantId) {
      toast.error(LABELS.UI_MESSAGES.RESTAURANT.SELECT_REQUIRED);
      return;
    }

    const priceParsed = parseFloat(formData.price);
    const restaurantIdParsed = parseInt(formData.restaurantId);
    const categoryIdParsed = formData.categoryId ? parseInt(formData.categoryId) : null;
    const tagsParsed = formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
    
    const caloriesParsed = formData.calories ? parseFloat(formData.calories) : null;
    const carbsParsed = formData.carbs ? parseFloat(formData.carbs) : null;
    const proteinParsed = formData.protein ? parseFloat(formData.protein) : null;
    const fatParsed = formData.fat ? parseFloat(formData.fat) : null;

    const validation = foodSchema.safeParse({
      name: formData.name,
      price: priceParsed,
      description: formData.description,
      image: formData.image,
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
      ...formData,
      price: priceParsed,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
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
