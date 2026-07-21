import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Grid, Users, Layers, LayoutGrid, CheckCircle, FileText, Check, Ban, Sparkles, Filter } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { tableService, DiningTable } from '@/services/table.service';
import { Restaurant } from '@/types/restaurant';
import { LABELS } from '@/constants/labels';
import { toast } from '@/store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';

interface TableManagerProps {
  restaurant: Restaurant | null;
  myBranches: Restaurant[];
  selectedSubTab?: 'list' | 'bulk';
  onSubTabChange?: (tabId: 'list' | 'bulk') => void;
}

export const TableManager = ({ restaurant, myBranches, selectedSubTab, onSubTabChange }: TableManagerProps) => {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeZone, setActiveZone] = useState<string>('ALL');

  // Local active tab fallback if not controlled
  const [localTab, setLocalTab] = useState<'list' | 'bulk'>('list');
  const activeTab = selectedSubTab || localTab;
  
  const setActiveTab = (tab: 'list' | 'bulk') => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setLocalTab(tab);
    }
  };

  // Form single table states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState<number>(4);
  const [tableZone, setTableZone] = useState('Khu chung');
  const [tableNote, setTableNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form bulk tables states
  const [bulkPrefix, setBulkPrefix] = useState('Bàn ');
  const [bulkFrom, setBulkFrom] = useState(1);
  const [bulkTo, setBulkTo] = useState(10);
  const [bulkCapacity, setBulkCapacity] = useState<number>(4);
  const [bulkZone, setBulkZone] = useState('Khu chung');

  // Set default branch
  useEffect(() => {
    if (restaurant) {
      setSelectedBranchId(restaurant.id);
    } else if (myBranches && myBranches.length > 0) {
      setSelectedBranchId(myBranches[0].id);
    }
  }, [restaurant, myBranches]);

  const loadTables = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const res = await tableService.getTables(selectedBranchId);
      setTables(res || []);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải danh sách bàn ăn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, [selectedBranchId]);

  const handleOpenAdd = () => {
    setEditingTableId(null);
    setTableName('');
    setTableCapacity(4);
    setTableZone('Khu chung');
    setTableNote('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (table: DiningTable) => {
    setEditingTableId(table.id);
    setTableName(table.name);
    setTableCapacity(table.capacity || 4);
    setTableZone(table.zone || 'Khu chung');
    setTableNote(table.note || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim() || !selectedBranchId) {
      toast.error('Tên bàn ăn không được để trống');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTableId) {
        await tableService.updateTable(editingTableId, {
          name: tableName.trim(),
          capacity: Number(tableCapacity),
          zone: tableZone.trim() || 'Khu chung',
          note: tableNote.trim() || undefined,
        });
        toast.success(LABELS.RESTAURANT.TABLE_MANAGER.UPDATE_SUCCESS);
      } else {
        await tableService.createTable({
          name: tableName.trim(),
          restaurantId: selectedBranchId,
          capacity: Number(tableCapacity),
          zone: tableZone.trim() || 'Khu chung',
          note: tableNote.trim() || undefined,
        });
        toast.success(LABELS.RESTAURANT.TABLE_MANAGER.CREATE_SUCCESS);
      }
      setIsFormOpen(false);
      setTableName('');
      setTableCapacity(4);
      setTableZone('Khu chung');
      setTableNote('');
      setEditingTableId(null);
      loadTables();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;

    if (bulkFrom > bulkTo) {
      toast.error('Số bắt đầu không được lớn hơn số kết thúc');
      return;
    }

    const count = bulkTo - bulkFrom + 1;
    if (count > 100) {
      toast.error('Chỉ hỗ trợ tạo tối đa 100 bàn mỗi lần để đảm bảo hiệu năng hệ thống');
      return;
    }

    setSubmitting(true);
    try {
      await tableService.bulkCreate({
        prefix: bulkPrefix,
        fromNumber: Number(bulkFrom),
        toNumber: Number(bulkTo),
        capacity: Number(bulkCapacity),
        restaurantId: selectedBranchId,
        zone: bulkZone.trim() || 'Khu chung',
      });
      toast.success('Đã tạo hàng loạt bàn ăn thành công!');
      setActiveTab('list');
      loadTables();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo hàng loạt';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (table: DiningTable) => {
    const confirm = window.confirm(LABELS.RESTAURANT.TABLE_MANAGER.CONFIRM_DELETE_MSG(table.name));
    if (!confirm) return;

    try {
      await tableService.deleteTable(table.id);
      toast.success(LABELS.RESTAURANT.TABLE_MANAGER.DELETE_SUCCESS);
      loadTables();
    } catch (e) {
      toast.error('Không thể xóa bàn ăn này');
    }
  };

  const updateStatus = async (table: DiningTable, newStatus: string) => {
    try {
      const currentGuests = newStatus === 'OCCUPIED' ? (table.currentGuests || 2) : 0;
      await tableService.updateTable(table.id, { status: newStatus, currentGuests });
      toast.success(`Đã cập nhật trạng thái bàn sang: ${
        newStatus === 'FREE' ? 'Trống' : 
        newStatus === 'OCCUPIED' ? 'Đang ăn' : 
        newStatus === 'RESERVED' ? 'Đã đặt trước' : 'Cần dọn dẹp'
      }`);
      loadTables();
    } catch (e) {
      toast.error('Không thể cập nhật trạng thái bàn ăn');
    }
  };

  // Get distinct zones from tables
  const zones = ['ALL', ...Array.from(new Set(tables.map(t => t.zone || 'Khu chung')))];
  
  // Filtered tables by zone
  const filteredTables = activeZone === 'ALL' 
    ? tables 
    : tables.filter(t => (t.zone || 'Khu chung') === activeZone);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section with Sub-tab buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md p-4 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100 flex items-center gap-2.5">
            <Grid size={22} className="text-primary" />
            {activeTab === 'list' ? 'Quản lý bàn ăn' : 'Thêm hàng loạt bàn'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-semibold">
            {activeTab === 'list' ? 'Theo dõi trạng thái phục vụ, đặt trước và phân loại khu vực' : 'Tạo nhanh dãy bàn ăn theo khu vực và thiết lập sẵn sức chứa'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab Switchers */}
          <div className="bg-gray-100 dark:bg-slate-950 p-1 rounded-xl flex gap-1 text-xs mr-2 border border-gray-150/40 dark:border-slate-900">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all ${
                activeTab === 'list' 
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                  : 'text-gray-400 hover:text-gray-650'
              }`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all ${
                activeTab === 'bulk' 
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                  : 'text-gray-400 hover:text-gray-650'
              }`}
            >
              Hàng loạt
            </button>
          </div>

          {myBranches.length > 1 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs font-bold text-gray-400">Chi nhánh:</span>
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                {myBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'list' && (
            <Button
              onClick={handleOpenAdd}
              className="shrink-0 py-2 px-3.5 font-black text-xs uppercase tracking-wider bg-primary hover:bg-primary-light text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all hover:scale-[1.01]"
            >
              <Plus size={14} />
              {LABELS.RESTAURANT.TABLE_MANAGER.ADD_TABLE}
            </Button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'list' ? (
        <div className="space-y-6">
          
          {/* Zone Filter Navigation (Redesign) */}
          {tables.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar select-none bg-white/40 dark:bg-slate-900/10 p-2 rounded-2xl border border-gray-50 dark:border-slate-800/40">
              <span className="text-xs text-gray-400 font-bold flex items-center gap-1 shrink-0 pl-1">
                <Filter size={12} />
                Khu vực:
              </span>
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setActiveZone(zone)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    activeZone === zone
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {zone === 'ALL' ? 'Tất cả' : zone}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <RefreshCw className="animate-spin text-primary mb-3" size={32} />
              <span className="text-xs font-bold">Đang tải danh sách bàn ăn...</span>
            </div>
          ) : tables.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center text-gray-400">
              <Grid className="mx-auto mb-3 text-gray-300 dark:text-slate-700" size={40} />
              <span className="text-xs font-bold block">{LABELS.RESTAURANT.TABLE_MANAGER.NO_TABLES}</span>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center text-gray-400">
              <span className="text-xs font-bold block">Không có bàn ăn nào trong khu vực này</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredTables.map((table) => {
                const isFree = table.status === 'FREE';
                const isOccupied = table.status === 'OCCUPIED';
                const isReserved = table.status === 'RESERVED';
                const isDirty = table.status === 'DIRTY';
                
                // Color mapping
                let statusColor = 'border-emerald-100 dark:border-emerald-950/20';
                let accentColor = 'bg-emerald-500';
                let badgeClass = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400';
                let statusLabel = 'Trống';
                
                if (isOccupied) {
                  statusColor = 'border-amber-100 dark:border-amber-950/20';
                  accentColor = 'bg-amber-500';
                  badgeClass = 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400';
                  statusLabel = 'Đang dùng';
                } else if (isReserved) {
                  statusColor = 'border-blue-100 dark:border-blue-950/20';
                  accentColor = 'bg-blue-500';
                  badgeClass = 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400';
                  statusLabel = 'Đặt trước';
                } else if (isDirty) {
                  statusColor = 'border-rose-100 dark:border-rose-950/20';
                  accentColor = 'bg-rose-500';
                  badgeClass = 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400';
                  statusLabel = 'Cần dọn';
                }

                return (
                  <motion.div
                    key={table.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group cursor-pointer relative overflow-hidden ${statusColor}`}
                  >
                    {/* Accent border bar */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${accentColor}`} />

                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-sm text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                          {table.name}
                        </h3>
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold bg-gray-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-slate-800/80">
                          {table.zone || 'Khu chung'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        {/* Status Badge */}
                        <span className={`self-start inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${accentColor}`} />
                          {statusLabel}
                        </span>

                        {/* Capacity Info */}
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-slate-500 font-bold pl-0.5 mt-1">
                          <Users size={12} className="text-gray-400" />
                          <span>👥 {table.capacity || 4} chỗ {isOccupied && `| 👤 Ngồi: ${table.currentGuests || 2}`}</span>
                        </div>

                        {/* Description/Note if exists */}
                        {table.note && (
                          <div className="flex items-start gap-1 text-[9px] text-gray-400 dark:text-slate-500 font-medium pl-0.5 mt-1 border-t border-gray-50 dark:border-slate-800/40 pt-1.5">
                            <FileText size={10} className="text-gray-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-1 italic">{table.note}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Action Buttons (Standard F&B Flow) */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-50 dark:border-slate-800/80 pl-2">
                      <div className="flex items-center justify-between gap-1.5">
                        {isFree && (
                          <div className="flex gap-1 w-full">
                            <button
                              onClick={() => updateStatus(table, 'OCCUPIED')}
                              className="text-[9px] font-black uppercase flex-1 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-center transition-all cursor-pointer"
                            >
                              Sử dụng
                            </button>
                            <button
                              onClick={() => updateStatus(table, 'RESERVED')}
                              className="text-[9px] font-black uppercase flex-1 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-center transition-all cursor-pointer"
                            >
                              Đặt trước
                            </button>
                          </div>
                        )}
                        {isOccupied && (
                          <button
                            onClick={() => updateStatus(table, 'DIRTY')}
                            className="text-[9px] font-black uppercase w-full py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 hover:bg-rose-500/20 text-center transition-all cursor-pointer"
                          >
                            Trả bàn / Cần dọn
                          </button>
                        )}
                        {isReserved && (
                          <div className="flex gap-1 w-full">
                            <button
                              onClick={() => updateStatus(table, 'OCCUPIED')}
                              className="text-[9px] font-black uppercase flex-1 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-center transition-all cursor-pointer"
                            >
                              Nhận bàn
                            </button>
                            <button
                              onClick={() => updateStatus(table, 'FREE')}
                              className="text-[9px] font-black uppercase px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 text-center transition-all cursor-pointer"
                            >
                              Hủy đặt
                            </button>
                          </div>
                        )}
                        {isDirty && (
                          <button
                            onClick={() => updateStatus(table, 'FREE')}
                            className="text-[9px] font-black uppercase w-full py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 text-center transition-all cursor-pointer"
                          >
                            Đã dọn xong 🧹
                          </button>
                        )}
                      </div>

                      {/* Edit/Delete Small Actions */}
                      <div className="flex items-center justify-end gap-1.5 mt-1 border-t border-gray-50/50 dark:border-slate-800/40 pt-1.5">
                        <button
                          onClick={() => handleOpenEdit(table)}
                          className="text-gray-400 hover:text-primary transition-colors p-1"
                          title="Chỉnh sửa cấu hình bàn"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(table)}
                          className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                          title="Xóa bàn"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Full Page Bulk Form - Premium Redesign */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-100/50 dark:shadow-none"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-800/80 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Thiết lập thêm hàng loạt bàn</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-0.5">Tạo dãy bàn ăn liên tiếp theo khu vực trong vài giây</p>
            </div>
          </div>

          <form onSubmit={handleBulkSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 dark:text-slate-350 flex items-center gap-1.5">
                  <LayoutGrid size={14} className="text-gray-400" />
                  Tiền tố tên bàn ăn <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  type="text"
                  placeholder="Ví dụ: Bàn A, Khu VIP..."
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix((e.target as HTMLInputElement).value)}
                  className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 dark:text-slate-350 flex items-center gap-1.5">
                  <Filter size={14} className="text-gray-400" />
                  Khu vực <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  type="text"
                  placeholder="Ví dụ: Tầng 1, Sân vườn, VIP..."
                  value={bulkZone}
                  onChange={(e) => setBulkZone((e.target as HTMLInputElement).value)}
                  className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 dark:text-slate-350 flex items-center gap-1.5">
                  <Users size={14} className="text-gray-400" />
                  Sức chứa (Mỗi bàn) <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  type="number"
                  min={1}
                  max={100}
                  value={bulkCapacity}
                  onChange={(e) => setBulkCapacity(Number((e.target as HTMLInputElement).value))}
                  className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 dark:text-slate-355 flex items-center gap-1">
                  Bắt đầu từ số <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  type="number"
                  min={1}
                  value={bulkFrom}
                  onChange={(e) => setBulkFrom(Number((e.target as HTMLInputElement).value))}
                  className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 dark:text-slate-355 flex items-center gap-1">
                  Đến số <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  type="number"
                  min={1}
                  value={bulkTo}
                  onChange={(e) => setBulkTo(Number((e.target as HTMLInputElement).value))}
                  className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {bulkFrom <= bulkTo && (
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <CheckCircle size={15} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-extrabold uppercase tracking-wide">Xem trước kết quả:</p>
                  <p className="mt-0.5 font-medium">Hệ thống sẽ tạo ra <span className="underline font-black">{bulkTo - bulkFrom + 1} bàn</span> mới thuộc khu vực <span className="underline font-black">&quot;{bulkZone}&quot;</span>: <span className="italic font-bold">{bulkPrefix}{bulkFrom}</span>, ..., <span className="italic font-bold">{bulkPrefix}{bulkTo}</span>. Mỗi bàn có sức chứa {bulkCapacity} khách.</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('list')}
                disabled={submitting}
                className="px-6 py-2.5 font-bold rounded-2xl"
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                disabled={submitting || bulkFrom > bulkTo}
                className="bg-primary hover:bg-primary-light text-white font-bold px-8 py-2.5 rounded-2xl shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {submitting ? 'Đang tạo...' : 'Tạo hàng loạt'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Popover Add/Edit Single Table Form - Premium Redesign */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="modal-wrapper">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="modal-overlay"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="modal-card max-w-md w-full relative z-10 p-6 md:p-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-850 rounded-3xl shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
                  <Grid size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">
                    {editingTableId ? 'Cấu hình bàn ăn' : 'Thêm bàn ăn mới'}
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-0.5">
                    {editingTableId ? 'Chỉnh sửa tên, khu vực và sức chứa của bàn' : 'Tạo một bàn ăn mới cho chi nhánh hiện tại'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-700 dark:text-slate-350 flex items-center gap-1.5">
                      <LayoutGrid size={14} className="text-gray-400" />
                      Tên bàn ăn <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="text"
                      placeholder="Ví dụ: Bàn A1..."
                      value={tableName}
                      onChange={(e) => setTableName((e.target as HTMLInputElement).value)}
                      className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-700 dark:text-slate-350 flex items-center gap-1.5">
                      <Filter size={14} className="text-gray-400" />
                      Khu vực <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="text"
                      placeholder="Tầng 1, VIP..."
                      value={tableZone}
                      onChange={(e) => setTableZone((e.target as HTMLInputElement).value)}
                      className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-700 dark:text-slate-355 flex items-center gap-1.5">
                    <Users size={14} className="text-gray-400" />
                    Sức chứa (Số khách tối đa) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={100}
                    placeholder="Sức chứa mặc định là 4"
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(Number((e.target as HTMLInputElement).value))}
                    className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-700 dark:text-slate-355 flex items-center gap-1.5">
                    <FileText size={14} className="text-gray-400" />
                    Ghi chú / Mô tả
                  </label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Bàn gần cửa sổ, Đã hỏng ghế..."
                    value={tableNote}
                    onChange={(e) => setTableNote((e.target as HTMLInputElement).value)}
                    className="w-full bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl py-3 px-4 outline-none focus:border-primary text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-800/80">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => setIsFormOpen(false)}
                    disabled={submitting}
                    className="rounded-2xl font-bold py-2.5"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    disabled={submitting || !tableName.trim()}
                    className="bg-primary hover:bg-primary-light text-white font-bold rounded-2xl shadow-md shadow-primary/20 transition-all active:scale-[0.98] py-2.5"
                  >
                    {submitting ? 'Đang lưu...' : 'Lưu lại'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
