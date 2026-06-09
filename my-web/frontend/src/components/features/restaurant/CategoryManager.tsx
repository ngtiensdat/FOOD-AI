// Mục đích file này để làm gì: Component quản lý hệ thống phân loại món ăn nhiều cấp (Nhóm -> Phân loại con).
// Các file khác hay file này có ý nghĩa như nào: Được dùng trong trang quản lý của Thương gia (Merchant Dashboard).
// Các chức năng đặc biệt: Hiển thị dạng cây đệ quy (tree view), các thao tác CRUD danh mục, sử dụng bảng padding tĩnh plMap để an toàn cho Tailwind JIT.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Recursive Rendering Pattern.
// Các biến, hàm đặc biệt trong file: CategoryManager component, renderCategories().

import React from 'react';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, Folder, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Category } from '@/services/category.service';
import { ConfirmModal } from '@/components/base/ConfirmModal';
import { useCategoryManager } from '@/hooks/useCategoryManager';
import { LABELS } from '@/constants/labels';

interface CategoryManagerProps {
  restaurantId: number;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ restaurantId }) => {
  const {
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
  } = useCategoryManager(restaurantId);

  // Render tree recursive - bỏ qua Category gốc tự động tạo (cùng tên với Group)
  const renderCategories = (categories: Category[], groupName: string, parentId: number | null = null, level: number = 0) => {
    const children = categories.filter(c => c.parentId === parentId && !(parentId === null && c.name === groupName));
    if (children.length === 0) return null;

    const plMap: Record<number, string> = {
      0: 'pl-4',
      1: 'pl-6',
      2: 'pl-8'
    };
    const paddingClass = plMap[level] || 'pl-8';

    return (
      <div className={`${paddingClass} mt-2 space-y-2 border-l border-gray-100 dark:border-slate-800 ml-4`}>
        {children.map(category => (
          <div key={category.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-400" />
                <span className="font-semibold text-gray-700 dark:text-slate-200 text-sm">{category.name}</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.PRIORITY_SHORT}{category.order}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {level < 3 && (
                  <button onClick={() => handleOpenAddCategory(category.groupId, category.id)} className="p-1.5 text-primary hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg" title={LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.ADD_SUB_CATEGORY}>
                    <Plus size={14} />
                  </button>
                )}
                <button onClick={() => handleOpenEditCategory(category)} className="icon-btn-blue">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setDeleteConfirm({ type: 'category', id: category.id })} className="icon-btn-rose">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {renderCategories(categories, groupName, category.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-500">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.LOADING}</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-h3 text-gray-800 dark:text-slate-100">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.TITLE}</h3>
          <div title={LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.HELP_TOOLTIP} className="cursor-help text-gray-400 hover:text-primary transition-colors bg-gray-100 p-1.5 rounded-full dark:bg-slate-800">
            <HelpCircle size={16} />
          </div>
        </div>
        <Button onClick={handleOpenAddGroup} className="flex items-center gap-2 rounded-xl">
          <Plus size={18} /> {LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.ADD_GROUP}
        </Button>
      </div>

      {/* Hướng dẫn sử dụng */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-2xl text-blue-800 dark:text-blue-300 text-sm">
        <p className="font-bold mb-1">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.GUIDE_TITLE}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.GUIDE_GROUP}</li>
          <li>{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.GUIDE_CATEGORY}</li>
        </ul>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="bg-gray-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleGroup(group.id)}>
                {expandedGroups[group.id] ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                <Folder size={20} className="text-primary" />
                <span className="font-bold text-gray-800 dark:text-slate-100 text-body">{group.name}</span>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 rounded-md border border-orange-100 dark:border-orange-800">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.PRIORITY_PREFIX}{group.order}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleOpenAddCategory(group.id)} className="p-2 text-primary hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl" title={LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.ADD_ROOT_CATEGORY}>
                  <Plus size={16} />
                </button>
                <button onClick={() => handleOpenEditGroup(group)} className="icon-btn-blue">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirm({ type: 'group', id: group.id })} className="icon-btn-rose">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {expandedGroups[group.id] && (
              <div className="mt-4">
                {group.categories && group.categories.length > 0 ? (
                  <>
                    {/* Hiển thị danh sách phân loại con, ẩn category gốc tự tạo cùng tên Group */}
                    {renderCategories(group.categories, group.name, null, 0)}

                    {/* Hiển thị note nếu nhóm chưa có sub-category nào do user tạo */}
                    {group.categories.filter(c => c.parentId === null && c.name !== group.name).length === 0 && (
                      <p className="text-sm text-gray-500 ml-8 mt-2 italic">
                        {LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.EMPTY_GROUP_NOTE}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 ml-8 mt-2 italic">
                    {LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.EMPTY_GROUP_NOTE}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-center p-12 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
            <Folder size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.EMPTY_GROUPS}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isGroupModalOpen && (
        <div className="modal-wrapper">
          <div className="modal-overlay" onClick={() => setIsGroupModalOpen(false)} />
          <div className="modal-card max-w-md w-full !p-6 relative">
            <h3 className="text-h3 mb-6 text-gray-800 dark:text-white">{editingGroup ? LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.EDIT_GROUP : LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.ADD_GROUP}</h3>
            <form onSubmit={handleSubmitGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.GROUP_NAME} <span className="text-rose-500">*</span></label>
                <input required minLength={2} maxLength={50} type="text" placeholder={LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.GROUP_PLACEHOLDER} value={groupFormData.name} onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })} className="form-input rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.DISPLAY_ORDER} <span className="text-rose-500">*</span></label>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2 leading-relaxed">
                  {LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.ORDER_DESC_GROUP}
                </p>
                <input required min={0} max={999} type="number" value={groupFormData.order} onChange={e => setGroupFormData({ ...groupFormData, order: e.target.value })} className="form-input rounded-xl px-4 py-3 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsGroupModalOpen(false)}>{LABELS.COMMON.CANCEL}</Button>
                <Button type="submit">{LABELS.COMMON.SAVE}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="modal-wrapper">
          <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="modal-card max-w-md w-full !p-6 relative">
            <h3 className="text-h3 mb-6 text-gray-800 dark:text-white">{editingCategory ? LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.EDIT_CATEGORY : LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.ADD_CATEGORY}</h3>
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.CATEGORY_NAME} <span className="text-rose-500">*</span></label>
                <input required minLength={2} maxLength={50} type="text" placeholder={LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.CATEGORY_PLACEHOLDER} value={categoryFormData.name} onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="form-input rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">{LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.DISPLAY_ORDER} <span className="text-rose-500">*</span></label>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2 leading-relaxed">
                  {LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.ORDER_DESC_CATEGORY}
                </p>
                <input required min={0} max={999} type="number" value={categoryFormData.order} onChange={e => setCategoryFormData({ ...categoryFormData, order: e.target.value })} className="form-input rounded-xl px-4 py-3 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>{LABELS.COMMON.CANCEL}</Button>
                <Button type="submit">{LABELS.COMMON.SAVE}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title={LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.CONFIRM_DELETE_TITLE}
        message={deleteConfirm ? LABELS.RESTAURANT.PUBLIC_PROFILE.CATEGORY_MANAGER.CONFIRM_DELETE_MESSAGE(deleteConfirm.type === 'group' ? 'nhóm' : 'phân loại') : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmText={LABELS.COMMON.DELETE}
        cancelText={LABELS.COMMON.CANCEL}
        variant="danger"
      />
    </div>
  );
};
