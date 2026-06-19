// Mục đích file này để làm gì: Custom hook quản lý trạng thái và các thao tác CRUD của nhóm danh mục và danh mục món ăn.
// Các file khác hay file này có ý nghĩa như nào: Được sử dụng bởi CategoryManager component để quản lý giao diện phân cấp thực đơn.
// Các chức năng đặc biệt: Tự động kiểm tra trùng lặp thứ tự hiển thị (Order), giới hạn số lượng nhóm tối đa, xử lý các modal Thêm/Sửa/Xóa.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Custom Hook Pattern, Optimistic UI/Toast Alerts, State encapsulation.
// Các biến, hàm đặc biệt trong file: useCategoryManager, fetchHierarchy, handleSubmitGroup, handleSubmitCategory, handleConfirmDelete.

import { useState, useEffect, useCallback } from 'react';

/* eslint-disable react-hooks/set-state-in-effect */
import { categoryService, CategoryGroup, Category } from '@/services/category.service';
import { toast } from '@/store/useToastStore';
import { LIMITS } from '@/constants/limits.constant';
import { LABELS } from '@/constants/labels';

export const useCategoryManager = (restaurantId: number) => {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Expanded state
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  
  // Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'group' | 'category', id: number } | null>(null);

  // Form state
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [groupFormData, setGroupFormData] = useState({ name: '', order: '0' });
  const [categoryFormData, setCategoryFormData] = useState({ 
    name: '', order: '0', groupId: 0, parentId: '' as string | number 
  });

  const fetchHierarchy = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getPublicHierarchy(restaurantId);
      setGroups(data);
    } catch (error) {
      toast.error(LABELS.UI_MESSAGES.CATEGORY.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHierarchy();
  }, [fetchHierarchy]);

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // --- Group Actions ---
  const handleOpenAddGroup = () => {
    if (groups.length >= LIMITS.MAX_CATEGORY_GROUPS) {
      return toast.error(LABELS.UI_MESSAGES.CATEGORY.MAX_GROUPS_LIMIT_ERROR(LIMITS.MAX_CATEGORY_GROUPS));
    }
    setEditingGroup(null);
    setGroupFormData({ name: '', order: '0' });
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: CategoryGroup) => {
    setEditingGroup(group);
    setGroupFormData({ name: group.name, order: group.order.toString() });
    setIsGroupModalOpen(true);
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.name) return toast.error(LABELS.UI_MESSAGES.CATEGORY.GROUP_NAME_REQUIRED);
    
    const targetOrder = parseInt(groupFormData.order) || 0;
    const isDuplicateOrder = groups.some(g => g.order === targetOrder && g.id !== editingGroup?.id);
    
    if (isDuplicateOrder) {
      return toast.error(LABELS.UI_MESSAGES.CATEGORY.GROUP_ORDER_DUPLICATE_ERROR(targetOrder));
    }

    try {
      if (editingGroup) {
        await categoryService.updateCategoryGroup(editingGroup.id, { 
          name: groupFormData.name, 
          order: parseInt(groupFormData.order) 
        });
        toast.success(LABELS.UI_MESSAGES.CATEGORY.GROUP_UPDATE_SUCCESS);
      } else {
        await categoryService.createCategoryGroup({ 
          name: groupFormData.name, 
          order: parseInt(groupFormData.order) 
        });
        toast.success(LABELS.UI_MESSAGES.CATEGORY.GROUP_ADD_SUCCESS);
      }
      setIsGroupModalOpen(false);
      fetchHierarchy();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message || LABELS.COMMON.ERROR;
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  // --- Category Actions ---
  const handleOpenAddCategory = (groupId: number, parentId?: number) => {
    setEditingCategory(null);
    setCategoryFormData({ 
      name: '', order: '0', groupId, parentId: parentId || '' 
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ 
      name: category.name, 
      order: category.order.toString(),
      groupId: category.groupId,
      parentId: category.parentId || ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) return toast.error(LABELS.UI_MESSAGES.CATEGORY.CATEGORY_NAME_REQUIRED);

    const targetOrder = parseInt(categoryFormData.order) || 0;
    const targetParentId = categoryFormData.parentId ? parseInt(categoryFormData.parentId as string) : null;

    // Prevent duplicate order among siblings
    const group = groups.find(g => g.id === categoryFormData.groupId);
    if (group) {
      const siblings = group.categories?.filter(c => c.parentId === targetParentId) || [];
      const isDuplicateOrder = siblings.some(c => c.order === targetOrder && c.id !== editingCategory?.id);
      if (isDuplicateOrder) {
        return toast.error(LABELS.UI_MESSAGES.CATEGORY.CATEGORY_ORDER_DUPLICATE_ERROR(targetOrder));
      }
    }

    const dataToSubmit = {
      name: categoryFormData.name,
      order: targetOrder,
      groupId: categoryFormData.groupId,
      parentId: targetParentId ? targetParentId : undefined
    };

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, dataToSubmit);
        toast.success(LABELS.UI_MESSAGES.CATEGORY.CATEGORY_UPDATE_SUCCESS);
      } else {
        await categoryService.createCategory(dataToSubmit);
        toast.success(LABELS.UI_MESSAGES.CATEGORY.CATEGORY_ADD_SUCCESS);
      }
      setIsCategoryModalOpen(false);
      fetchHierarchy();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message || LABELS.COMMON.ERROR;
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  // --- Delete Actions ---
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'group') {
        await categoryService.deleteCategoryGroup(deleteConfirm.id);
        toast.success(LABELS.UI_MESSAGES.CATEGORY.GROUP_DELETE_SUCCESS);
      } else {
        await categoryService.deleteCategory(deleteConfirm.id);
        toast.success(LABELS.UI_MESSAGES.CATEGORY.CATEGORY_DELETE_SUCCESS);
      }
      setDeleteConfirm(null);
      fetchHierarchy();
    } catch (error) {
      toast.error(LABELS.UI_MESSAGES.CATEGORY.HAS_FOODS_ERROR);
    }
  };

  return {
    groups,
    loading,
    expandedGroups,
    toggleGroup,
    
    // Group states and actions
    isGroupModalOpen,
    setIsGroupModalOpen,
    editingGroup,
    groupFormData,
    setGroupFormData,
    handleOpenAddGroup,
    handleOpenEditGroup,
    handleSubmitGroup,

    // Category states and actions
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    editingCategory,
    categoryFormData,
    setCategoryFormData,
    handleOpenAddCategory,
    handleOpenEditCategory,
    handleSubmitCategory,

    // Delete states and actions
    deleteConfirm,
    setDeleteConfirm,
    handleConfirmDelete
  };
};
