'use client';

import { useState, useEffect } from 'react';
import { foodService } from '@/services/food.service';
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

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMyFoods();
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
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t) 
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
      }
    } catch (error) {
      toast.error(LABELS.COMMON.ERROR);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(LABELS.ADMIN.CONFIRM.DELETE_FOOD)) {
      if (await foodService.updateFood(id, { isActive: false })) {
        fetchMyFoods();
      }
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
    actions: {
      handleOpenAdd,
      onEdit: handleOpenEdit,
      onDelete: handleDelete,
      handleSubmit
    }
  };
};
