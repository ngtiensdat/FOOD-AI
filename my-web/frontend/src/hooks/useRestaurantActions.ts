'use client';

import { useState, useEffect } from 'react';
import { foodService, restaurantService } from '@/services/food.service';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';

/**
 * Custom Hook: useRestaurantActions
 * Quản lý logic và trạng thái cho Merchant Hub (Trang chủ nhà hàng).
 */
export const useRestaurantActions = (user: any) => {
  const [myFoods, setMyFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'ai-history'>('overview');
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [editingFood, setEditingFood] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  const [restaurant, setRestaurant] = useState<any>(null);
  const [isRestaurantActive, setIsRestaurantActive] = useState<boolean>(true);
  
  const [formData, setFormData] = useState({
    name: '', price: '', description: '', image: '', tags: '', address: '', mapUrl: '', lat: '', lng: ''
  });

  const fetchMyFoods = async () => {
    setLoading(true);
    try {
      setMyFoods(await foodService.getMyFoods());
    } catch (error) {
      console.error('Lỗi khi tải món ăn:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurant = async () => {
    try {
      const res = await restaurantService.getMyRestaurant();
      if (res) {
        setRestaurant(res);
        setIsRestaurantActive(res.isActive);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin cửa hàng:', error);
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
      const cleanHours = openingHours.replace(/\s+/g, '');
      const match = cleanHours.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
      if (!match) {
        toast.error(LABELS.RESTAURANT.HOURS_FORMAT_ERROR);
        return;
      }
      const [, sh, sm, eh, em] = match;
      const shNum = parseInt(sh, 10);
      const smNum = parseInt(sm, 10);
      const ehNum = parseInt(eh, 10);
      const emNum = parseInt(em, 10);
      if (shNum > 23 || smNum > 59 || ehNum > 23 || emNum > 59) {
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

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMyFoods();
      fetchRestaurant();
    }
  }, [user]);

  const handleOpenAdd = () => {
    setEditingFood(null);
    setFormData({ 
      name: '', price: '', description: '', image: '', tags: '', address: '', mapUrl: '', lat: '', lng: '' 
    });
    setIsAddingFood(true);
  };

  const handleOpenEdit = (food: any) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      price: food.price.toString(),
      description: food.description || '',
      image: food.image || '',
      tags: food.tags?.join(', ') || '',
      address: food.address || '',
      mapUrl: food.mapUrl || food.map_url || '',
      lat: food.lat?.toString() || '',
      lng: food.lng?.toString() || ''
    });
    setIsAddingFood(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      ...formData, 
      price: parseFloat(formData.price), 
      lat: formData.lat ? parseFloat(formData.lat) : null, 
      lng: formData.lng ? parseFloat(formData.lng) : null, 
      tags: formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
      restaurantId: restaurant?.id
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
    restaurant,
    isRestaurantActive,
    deleteConfirmId,
    setDeleteConfirmId,
    actions: {
      handleOpenAdd,
      onEdit: handleOpenEdit,
      onDelete: handleDelete,
      onConfirmDelete: handleConfirmDelete,
      handleSubmit,
      toggleRestaurantStatus,
      updateProfileHours
    }
  };
};
