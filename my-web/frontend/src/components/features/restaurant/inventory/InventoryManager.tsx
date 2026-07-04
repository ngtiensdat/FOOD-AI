'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Edit2, Trash2, Save, XCircle, BookOpen, 
  Sparkles, Package, ListOrdered, History, ArrowDownToLine, 
  AlertTriangle, Check, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Restaurant } from '@/types/restaurant';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { Ingredient } from '@/services/inventory.service';
import { LABELS } from '@/constants/labels';
import { UploadIngredientExcelModal } from './UploadIngredientExcelModal';
import { useInventory, InventoryTab } from './useInventory';

interface InventoryManagerProps {
  restaurant: Restaurant | null;
  myBranches: Restaurant[];
  selectedSubTab?: InventoryTab;
  onSubTabChange?: (tabId: InventoryTab) => void;
}

export function InventoryManager({ restaurant, myBranches, selectedSubTab, onSubTabChange }: InventoryManagerProps) {
  const unitOptions = LABELS.RESTAURANT.INVENTORY_TABS.UNITS;
  const [showGuide, setShowGuide] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const inv = useInventory({ restaurant, myBranches });

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (selectedSubTab) inv.setActiveTab(selectedSubTab);
  }, [selectedSubTab]);

  const handleTabClick = (tabId: InventoryTab) => {
    inv.setActiveTab(tabId);
    if (onSubTabChange) onSubTabChange(tabId);
  };

  const renderPortal = (children: React.ReactNode) => {
    if (!isMounted || typeof document === 'undefined') return null;
    return createPortal(children, document.body);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Upper Header and Branch Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Package size={24} className="text-primary" />
            Quản lý Tồn kho
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Theo dõi chính xác định lượng nguyên vật liệu, cấu hình quy đổi và kiểm kê xuất nhập kho.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {myBranches.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Chi nhánh:</span>
              <select
                value={inv.selectedBranchId}
                onChange={(e) => inv.setSelectedBranchId(Number(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {myBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={() => inv.setIsImportExcelOpen(true)}
            variant="outline"
            className="shrink-0 py-2 px-3.5 font-black text-xs uppercase tracking-wider border-gray-200 text-gray-700 dark:text-slate-300 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl flex items-center gap-2 transition-all hover:scale-[1.01]"
          >
            <ArrowDownToLine size={16} />
            Nhập Excel
          </Button>

          <Button
            onClick={inv.handleOpenAddModal}
            className="shrink-0 py-2 px-3.5 font-black text-xs uppercase tracking-wider bg-primary hover:bg-primary-light text-white rounded-xl flex items-center gap-2 shadow-md shadow-primary/10 transition-all hover:scale-[1.01]"
          >
            <Plus size={16} />
            Thêm nguyên liệu
          </Button>
        </div>
      </div>

      {/* Guidelines Accordion/Banner */}
      {showGuide && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative bg-orange-50/70 dark:bg-amber-950/20 border border-orange-100 dark:border-amber-900/40 rounded-2xl p-5"
        >
          <button 
            onClick={() => setShowGuide(false)}
            className="absolute top-4 right-4 text-orange-400 dark:text-amber-600 hover:text-orange-600 dark:hover:text-amber-400"
          >
            <XCircle size={20} />
          </button>
          
          <div className="flex gap-3">
            <BookOpen className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div className="space-y-3">
              <h4 className="text-sm font-black text-orange-800 dark:text-amber-400 flex items-center gap-1.5">
                Hướng dẫn vận hành hệ thống Tồn kho F&B
                <Sparkles size={14} className="animate-pulse" />
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium text-orange-700 dark:text-amber-500/90">
                {[
                  { title: 'Bước 1: Tạo nguyên liệu thô', desc: 'Khai báo các nguyên liệu thô (ví dụ: Thịt bò, Nước cốt cốt lèo, Hộp xốp, Muỗng nhựa) kèm đơn vị tính thô (kg, lít, cái).' },
                  { title: 'Bước 2: Cài định lượng quy đổi', desc: 'Qua tab **Công thức**, thiết lập mỗi món ăn bán ra tiêu tốn bao nhiêu nguyên liệu (ví dụ: 1 tô Phở tiêu hao 0.15kg thịt bò, 1 cái tô giấy).' },
                  { title: 'Bước 3: Nhập kho nguyên liệu', desc: 'Thực hiện nhập số lượng thực tế mua vào trong tab **Kho nguyên liệu**. Thiết lập ngưỡng cảnh báo tồn kho tối thiểu (`minStock`).' },
                  { title: 'Bước 4: Tự động trừ kho', desc: 'Hệ thống tự động liên kết công thức và trừ lượng nguyên liệu tương ứng mỗi khi đơn hàng của món đó được hoàn tất.' },
                ].map((step, i) => (
                  <div key={i} className="bg-white/50 dark:bg-slate-950/40 p-3 rounded-xl border border-orange-100/50 dark:border-amber-900/20">
                    <span className="font-bold text-orange-900 dark:text-amber-400 block mb-1">{step.title}</span>
                    {step.desc}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Content: Ingredients */}
      {inv.activeTab === 'ingredients' && (
        <IngredientTabContent
          ingredients={inv.ingredients}
          onImport={inv.handleOpenImportModal}
          onEdit={inv.handleOpenEditModal}
          onDelete={inv.handleDeleteIngredient}
        />
      )}

      {/* Tab Content: Recipes */}
      {inv.activeTab === 'recipes' && (
        <RecipeTabContent
          recipes={inv.recipes}
          onConfigure={inv.handleOpenRecipeModal}
        />
      )}

      {/* Tab Content: Logs */}
      {inv.activeTab === 'logs' && (
        <LogsTabContent logs={inv.logs} />
      )}

      {/* Modal: Add Ingredient */}
      {renderPortal(
        <AnimatePresence>
          {inv.isAddModalOpen && (
            <IngredientFormModal
              title="Thêm nguyên vật liệu"
              icon={<Package className="text-primary" size={24} />}
              onClose={() => inv.setIsAddModalOpen(false)}
              onSubmit={inv.handleCreateIngredient}
              submitLabel="Lưu nguyên liệu"
              name={inv.name} setName={inv.setName}
              sku={inv.sku} setSku={inv.setSku}
              unit={inv.unit} setUnit={inv.setUnit}
              quantity={inv.quantity} setQuantity={inv.setQuantity}
              minStock={inv.minStock} setMinStock={inv.setMinStock}
              unitOptions={unitOptions}
              nameLabel="Tên nguyên liệu *"
              namePlaceholder="Ví dụ: Thịt bò tái, Tô nhựa, Nước chấm"
              qtyLabel="Số lượng khởi tạo"
              minStockLabel="Ngưỡng báo động tồn kho thấp"
            />
          )}
        </AnimatePresence>
      )}

      {/* Modal: Edit Ingredient */}
      {renderPortal(
        <AnimatePresence>
          {inv.isEditModalOpen && (
            <IngredientFormModal
              title="Sửa nguyên vật liệu"
              icon={<Edit2 className="text-primary" size={24} />}
              onClose={() => inv.setIsEditModalOpen(false)}
              onSubmit={inv.handleUpdateIngredient}
              submitLabel="Cập nhật nguyên liệu"
              name={inv.name} setName={inv.setName}
              sku={inv.sku} setSku={inv.setSku}
              unit={inv.unit} setUnit={inv.setUnit}
              quantity={inv.quantity} setQuantity={inv.setQuantity}
              minStock={inv.minStock} setMinStock={inv.setMinStock}
              unitOptions={unitOptions}
              nameLabel="Tên nguyên liệu *"
              qtyLabel="Tồn kho thực tế"
              minStockLabel="Ngưỡng báo động tồn tối thiểu"
            />
          )}
        </AnimatePresence>
      )}

      {/* Modal: Import Stock */}
      {renderPortal(
        <AnimatePresence>
          {inv.isImportModalOpen && (
            <ImportStockModal
              onClose={() => inv.setIsImportModalOpen(false)}
              onSubmit={inv.handleImportIngredient}
              ingredients={inv.ingredients}
              importIngredientId={inv.importIngredientId}
              setImportIngredientId={inv.setImportIngredientId}
              importQty={inv.importQty}
              setImportQty={inv.setImportQty}
              importNote={inv.importNote}
              setImportNote={inv.setImportNote}
            />
          )}
        </AnimatePresence>
      )}

      {/* Modal: Setup Recipe */}
      {renderPortal(
        <AnimatePresence>
          {inv.isRecipeModalOpen && (
            <RecipeSetupModal
              onClose={() => inv.setIsRecipeModalOpen(false)}
              onSubmit={inv.handleSaveRecipe}
              currentFoodName={inv.currentFoodName}
              ingredients={inv.ingredients}
              recipeItems={inv.recipeItems}
              onAddRow={inv.handleAddRecipeRow}
              onRemoveRow={inv.handleRemoveRecipeRow}
              onRowChange={inv.handleRecipeRowChange}
            />
          )}
        </AnimatePresence>
      )}

      {/* Modal: Import Excel */}
      {renderPortal(
        <AnimatePresence>
          {inv.isImportExcelOpen && (
            <UploadIngredientExcelModal
              isOpen={inv.isImportExcelOpen}
              onClose={() => inv.setIsImportExcelOpen(false)}
              myBranches={myBranches}
              onSuccess={() => {
                inv.setIsImportExcelOpen(false);
                inv.loadData();
              }}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-components tách ra inline cho gọn — vẫn nằm chung file vì chỉ dùng
   ở đây và nhỏ hơn 150 dòng mỗi component.
   ────────────────────────────────────────────────────────────────────────── */

function IngredientTabContent({ ingredients, onImport, onEdit, onDelete }: {
  ingredients: Ingredient[];
  onImport: (ing?: Ingredient) => void;
  onEdit: (ing: Ingredient) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={() => onImport()} variant="outline" size="sm"
          className="text-emerald-600 border-emerald-150 hover:bg-emerald-50 dark:border-slate-800/80 flex items-center gap-1.5">
          <ArrowDownToLine size={16} /> Nhập kho nguyên liệu
        </Button>
      </div>

      <div className="card-container overflow-x-auto w-full custom-scrollbar">
        {ingredients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="mx-auto text-gray-300 mb-3" size={48} />
            <span className="text-sm font-bold block">Chưa có nguyên vật liệu nào trong kho. Hãy thêm ngay!</span>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="table-header-row">
                <th className="px-8 py-5 font-bold">Tên nguyên liệu</th>
                <th className="px-8 py-5 font-bold">Mã SKU</th>
                <th className="px-8 py-5 font-bold text-right">Tồn kho hiện tại</th>
                <th className="px-8 py-5 font-bold text-center">Đơn vị</th>
                <th className="px-8 py-5 font-bold text-right">Ngưỡng cảnh báo</th>
                <th className="px-8 py-5 font-bold text-center">Trạng thái</th>
                <th className="px-8 py-5 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {ingredients.map((ing) => {
                const isLow = ing.quantity <= ing.minStock;
                return (
                  <tr key={ing.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
                    <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">{ing.name}</td>
                    <td className="px-8 py-5 font-medium text-gray-400">{ing.sku || '-'}</td>
                    <td className={`px-8 py-5 text-right font-black ${isLow ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                      {ing.quantity.toFixed(2)}
                    </td>
                    <td className="px-8 py-5 text-center font-medium text-gray-500">{ing.unit}</td>
                    <td className="px-8 py-5 text-right font-medium text-gray-400">{ing.minStock.toFixed(2)}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-xl border ${
                        isLow
                          ? 'bg-red-50 text-red-600 border-red-100 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50'
                          : 'bg-green-50 text-green-600 border-green-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                      }`}>
                        {isLow ? <AlertTriangle size={12} /> : <Check size={12} />}
                        {isLow ? 'Cảnh báo hết hàng' : 'Đang an toàn'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onImport(ing)}
                          className="text-emerald-600 border-emerald-100 hover:bg-emerald-50 dark:border-slate-800" title="Nhập thêm kho">
                          <ArrowDownToLine size={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onEdit(ing)}
                          className="text-blue-600 dark:text-blue-400" title="Chỉnh sửa thông số">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onDelete(ing.id, ing.name)}
                          className="text-red-600 dark:text-rose-450" title="Xoá nguyên liệu">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function RecipeTabContent({ recipes, onConfigure }: {
  recipes: { foodId: number; foodName: string; price: number; items: { recipeItemId: string; ingredientName: string; usedQuantity: number; unit: string }[] }[];
  onConfigure: (recipe: any) => void;
}) {
  return (
    <div className="card-container overflow-x-auto w-full custom-scrollbar">
      {recipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ListOrdered className="mx-auto text-gray-300 mb-3" size={48} />
          <span className="text-sm font-bold block">Nhà hàng chưa có món ăn nào trong thực đơn.</span>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="table-header-row">
              <th className="px-8 py-5 font-bold">Tên món ăn</th>
              <th className="px-8 py-5 font-bold text-right">Giá bán</th>
              <th className="px-8 py-5 font-bold">Định lượng tiêu hao nguyên liệu thô</th>
              <th className="px-8 py-5 font-bold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {recipes.map((recipe) => (
              <tr key={recipe.foodId} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
                <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">{recipe.foodName}</td>
                <td className="px-8 py-5 text-right font-semibold">{recipe.price.toLocaleString('vi-VN')} đ</td>
                <td className="px-8 py-5">
                  {recipe.items.length === 0 ? (
                    <span className="text-xs font-semibold text-gray-400 italic">Chưa cài công thức quy đổi</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {recipe.items.map((item) => (
                        <span key={item.recipeItemId} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-gray-50 dark:bg-slate-950/60 border border-gray-150 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                          {item.ingredientName}: <strong className="text-gray-900 dark:text-slate-200">{item.usedQuantity.toFixed(4)} {item.unit}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-8 py-5 text-center">
                  <Button variant="outline" size="sm" onClick={() => onConfigure(recipe)}
                    className="text-blue-600 border-blue-100 dark:border-slate-800 hover:bg-blue-50">
                    <Settings size={14} className="mr-1" /> Cấu hình quy đổi
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LogsTabContent({ logs }: {
  logs: { id: string; createdAt: string; type: string; quantity: number; note?: string | null; ingredient?: { name: string; unit: string } | null }[];
}) {
  return (
    <div className="card-container overflow-x-auto w-full custom-scrollbar">
      {logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History className="mx-auto text-gray-300 mb-3" size={48} />
          <span className="text-sm font-bold block">Chưa có nhật ký xuất nhập kho nào.</span>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="table-header-row">
              <th className="px-8 py-5 font-bold">Thời gian</th>
              <th className="px-8 py-5 font-bold">Nguyên liệu</th>
              <th className="px-8 py-5 font-bold text-center">Loại biến động</th>
              <th className="px-8 py-5 font-bold text-right">Lượng đổi</th>
              <th className="px-8 py-5 font-bold">Ghi chú đối chiếu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
                <td className="px-8 py-5 text-gray-400">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">{log.ingredient?.name || 'Nguyên liệu'}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-xl ${
                    log.type === 'IMPORT' ? 'bg-green-50 text-green-600 dark:bg-emerald-950/30 dark:text-emerald-450'
                    : log.type === 'ORDER_DEDUCTION' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-450'
                    : log.type === 'ADJUSTMENT' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'
                    : 'bg-red-50 text-red-600 dark:bg-rose-950/30 dark:text-rose-400'
                  }`}>
                    {log.type === 'IMPORT' ? 'Nhập kho' : log.type === 'ORDER_DEDUCTION' ? 'Trừ bán hàng' : log.type === 'ADJUSTMENT' ? 'Kiểm kê' : 'Hao hụt/Hỏng'}
                  </span>
                </td>
                <td className={`px-8 py-5 text-right font-black ${log.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {log.quantity > 0 ? `+${log.quantity.toFixed(2)}` : log.quantity.toFixed(2)} {log.ingredient?.unit}
                </td>
                <td className="px-8 py-5 font-medium text-gray-650 dark:text-slate-400 max-w-sm truncate" title={log.note || ''}>
                  {log.note || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function IngredientFormModal({ title, icon, onClose, onSubmit, submitLabel, name, setName, sku, setSku, unit, setUnit, quantity, setQuantity, minStock, setMinStock, unitOptions, nameLabel, namePlaceholder, qtyLabel, minStockLabel }: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  name: string; setName: (v: string) => void;
  sku: string; setSku: (v: string) => void;
  unit: string; setUnit: (v: string) => void;
  quantity: number; setQuantity: (v: number) => void;
  minStock: number; setMinStock: (v: number) => void;
  unitOptions: { value: string; label: string }[];
  nameLabel: string;
  namePlaceholder?: string;
  qtyLabel: string;
  minStockLabel: string;
}) {
  return (
    <div className="modal-wrapper">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="modal-overlay" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card max-w-md w-full relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-h3 flex items-center gap-3 text-gray-900 dark:text-white">{icon} {title}</h3>
          <Button onClick={onClose} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
            <XCircle size={28} />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input label={nameLabel} type="text" required placeholder={namePlaceholder} value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
          <Input label="Mã SKU định danh (Không bắt buộc)" type="text" placeholder="Ví dụ: TB-01" value={sku} onChange={(e) => setSku((e.target as HTMLInputElement).value)} />

          <div className="grid grid-cols-2 gap-4">
            <Input label={qtyLabel} type="number" step="0.001" value={quantity.toString()} onChange={(e) => setQuantity(parseFloat((e.target as HTMLInputElement).value) || 0)} />
            <div className="space-y-2">
              <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">Đơn vị tính thô *</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="form-input py-4 px-6 rounded-2xl text-sm font-semibold cursor-pointer">
                {unitOptions?.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
          </div>

          <Input label={minStockLabel} type="number" step="0.001" value={minStock.toString()} onChange={(e) => setMinStock(parseFloat((e.target as HTMLInputElement).value) || 0)} />

          <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
            <Button type="button" variant="outline" fullWidth onClick={onClose}>Hủy</Button>
            <Button type="submit" fullWidth className="bg-primary hover:bg-primary-light text-white font-bold flex items-center justify-center gap-2">
              <Save size={16} /> {submitLabel}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ImportStockModal({ onClose, onSubmit, ingredients, importIngredientId, setImportIngredientId, importQty, setImportQty, importNote, setImportNote }: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  ingredients: Ingredient[];
  importIngredientId: string; setImportIngredientId: (v: string) => void;
  importQty: number; setImportQty: (v: number) => void;
  importNote: string; setImportNote: (v: string) => void;
}) {
  return (
    <div className="modal-wrapper">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="modal-overlay" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card max-w-md w-full relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-h3 flex items-center gap-3 text-gray-900 dark:text-white"><ArrowDownToLine className="text-emerald-500" size={24} /> Nhập hàng vào kho</h3>
          <Button onClick={onClose} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"><XCircle size={28} /></Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">Chọn nguyên vật liệu *</label>
            <select value={importIngredientId} onChange={(e) => setImportIngredientId(e.target.value)} className="form-input py-4 px-6 rounded-2xl text-sm font-semibold cursor-pointer">
              {ingredients.map((ing) => (<option key={ing.id} value={ing.id}>{ing.name} (Hiện tại: {ing.quantity} {ing.unit})</option>))}
            </select>
          </div>

          <Input label="Số lượng nhập hàng bổ sung *" type="number" step="0.001" required value={importQty.toString()} onChange={(e) => setImportQty(parseFloat((e.target as HTMLInputElement).value) || 0)} />
          <Input label="Ghi chú hoá đơn nhập kho (Ví dụ: Nhập hàng chợ sáng, Hoá đơn số 2)" type="text" placeholder="Tùy chọn" value={importNote} onChange={(e) => setImportNote((e.target as HTMLInputElement).value)} />

          <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
            <Button type="button" variant="outline" fullWidth onClick={onClose}>Hủy</Button>
            <Button type="submit" fullWidth className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2"><Save size={16} /> Xác nhận nhập kho</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RecipeSetupModal({ onClose, onSubmit, currentFoodName, ingredients, recipeItems, onAddRow, onRemoveRow, onRowChange }: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  currentFoodName: string;
  ingredients: Ingredient[];
  recipeItems: { ingredientId: string; usedQuantity: number }[];
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onRowChange: (index: number, field: 'ingredientId' | 'usedQuantity', value: string | number) => void;
}) {
  return (
    <div className="modal-wrapper">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="modal-overlay" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card max-w-xl w-full relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-h3 flex items-center gap-3 text-gray-900 dark:text-white"><Settings className="text-primary" size={24} /> Quy đổi định lượng món ăn</h3>
          <Button onClick={onClose} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"><XCircle size={28} /></Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
          Đang thiết lập định lượng tiêu hao nguyên liệu thô để làm ra 1 suất ăn: <span className="font-bold text-gray-900 dark:text-white">{currentFoodName}</span>
        </p>

        {ingredients.length === 0 ? (
          <div className="text-center py-6 text-rose-500 font-semibold text-sm flex items-center justify-center gap-1.5">
            <AlertTriangle size={16} />
            Vui lòng tạo nguyên liệu thô trước tại Tab Kho nguyên liệu!
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {recipeItems.map((item, index) => {
                const activeIng = ingredients.find(ing => ing.id === item.ingredientId);
                const currentUnit = activeIng ? activeIng.unit : '';
                return (
                  <div key={index} className="flex items-center gap-3 bg-gray-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <div className="flex-1 space-y-1">
                      <span className="text-xxs font-bold text-gray-400 ml-1">Nguyên liệu</span>
                      <select value={item.ingredientId} onChange={(e) => onRowChange(index, 'ingredientId', e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer">
                        {ingredients.map((ing) => (<option key={ing.id} value={ing.id}>{ing.name}</option>))}
                      </select>
                    </div>

                    <div className="w-32 space-y-1">
                      <span className="text-xxs font-bold text-gray-400 ml-1">Lượng dùng ({currentUnit})</span>
                      <input type="number" step="0.0001" required value={item.usedQuantity.toString()} onChange={(e) => onRowChange(index, 'usedQuantity', e.target.value)}
                        className="bg-white dark:bg-slate-955 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none w-full" />
                    </div>

                    {recipeItems.length > 1 && (
                      <button type="button" onClick={() => onRemoveRow(index)} className="text-rose-500 hover:text-rose-700 pt-5 self-center"><Trash2 size={18} /></button>
                    )}
                  </div>
                );
              })}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={onAddRow}
              className="text-primary border-primary/20 hover:bg-primary/5 flex items-center gap-1 px-4 w-full justify-center">
              <Plus size={14} /> Thêm nguyên liệu tiêu hao
            </Button>

            <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
              <Button type="button" variant="outline" fullWidth onClick={onClose}>Hủy</Button>
              <Button type="submit" fullWidth className="bg-primary hover:bg-primary-light text-white font-bold flex items-center justify-center gap-2"><Save size={16} /> Lưu công thức quy đổi</Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
