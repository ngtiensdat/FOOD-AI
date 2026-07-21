// Mục đích file này để làm gì: Component giao diện phần Quản lý thiết bị POS trong trang Quản lý Merchant Hub.
// Các file khác hay file này có ý nghĩa như nào: Là một tab giao diện của trang Merchant Admin Dashboard, giao tiếp qua hook usePosTerminal.
// Các chức năng đặc biệt: Hiển thị danh sách thiết bị máy POS, hỗ trợ bật/tắt thiết bị, tạo mới, chỉnh sửa, đổi mật khẩu và theo dõi lịch sử nhật ký (logs) thời gian thực của máy POS.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, Tabbed View Design, Portal Rendering.
// Các biến, hàm đặc biệt trong file: PosTerminalManager, Modals (Add, Edit), Logs Table.
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Monitor, Plus, Trash2, Edit2, Shield, Laptop, 
  Tv, Key, Store, XCircle, Save, Clock, 
  History, Info, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Restaurant } from '@/types/restaurant';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { usePosTerminal, PosTerminalSubTab } from './usePosTerminal';
import { LABELS } from '@/constants/labels';
import { PosTerminal, PosTerminalLog } from '@/services/pos-terminal.service';

interface PosTerminalManagerProps {
  restaurant: Restaurant | null;
  myBranches: Restaurant[];
  selectedSubTab?: PosTerminalSubTab;
  onSubTabChange?: (tabId: PosTerminalSubTab) => void;
}

export function PosTerminalManager({ restaurant, myBranches, selectedSubTab, onSubTabChange }: PosTerminalManagerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const p = usePosTerminal({ myBranches });
  const t = LABELS.RESTAURANT.POS_TERMINAL_MANAGER;

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { if (selectedSubTab) p.setActiveSubTab(selectedSubTab); }, [selectedSubTab]);

  const handleTabClick = (tabId: PosTerminalSubTab) => {
    p.setActiveSubTab(tabId);
    if (onSubTabChange) onSubTabChange(tabId);
  };

  const renderPortal = (children: React.ReactNode) => {
    if (!isMounted || typeof document === 'undefined') return null;
    return createPortal(children, document.body);
  };

  const currentBranch = myBranches.find(b => b.id === p.selectedBranchId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Monitor size={24} className="text-primary" /> {t.TITLE}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {t.DESC}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Branch selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Chi nhánh:</span>
            <select 
              value={p.selectedBranchId} 
              onChange={(e) => p.setSelectedBranchId(Number(e.target.value))} 
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:border-primary cursor-pointer"
            >
              {myBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {p.activeSubTab === 'machines' && (
            <Button onClick={p.handleOpenAddModal}
              className="py-2.5 px-4 font-black text-xs uppercase tracking-wider bg-primary hover:bg-primary-light text-white rounded-xl flex items-center gap-2 shadow-md shadow-primary/10 transition-all hover:scale-[1.01]">
              <Plus size={16} /> {t.ADD_TERMINAL}
            </Button>
          )}
        </div>
      </div>

      {/* Sub-tab pills */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
        {([
          { id: 'machines' as const, label: t.TAB_MACHINES, icon: <Laptop size={16} /> },
          { id: 'logs' as const, label: t.TAB_LOGS, icon: <History size={16} /> },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              p.activeSubTab === tab.id
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10 scale-[1.01]'
                : 'bg-white dark:bg-slate-900 text-gray-500 border-gray-150 dark:border-slate-800 hover:text-gray-750 dark:hover:text-slate-350'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {p.activeSubTab === 'machines' && (
        <MachinesTab 
          terminalList={p.terminalList} 
          toggleStatus={p.toggleStatus} 
          onEdit={p.handleOpenEditModal} 
          onDelete={p.handleDeleteTerminal} 
          t={t}
        />
      )}
      {p.activeSubTab === 'logs' && (
        <LogsTab 
          logList={p.logList} 
          t={t}
        />
      )}

      {/* Modal: Create POS Machine */}
      {renderPortal(
        <AnimatePresence>
          {p.isAddModalOpen && (
            <div className="modal-wrapper">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => p.setIsAddModalOpen(false)} className="modal-overlay" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card max-w-md w-full relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-h3 flex items-center gap-3 text-gray-900 dark:text-white"><Shield className="text-primary" size={24} /> {t.ADD_TERMINAL}</h3>
                  <Button onClick={() => p.setIsAddModalOpen(false)} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"><XCircle size={28} /></Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 -mt-4">
                  Tạo tài khoản đăng nhập máy POS cho chi nhánh: <span className="font-bold text-gray-700 dark:text-slate-200">{currentBranch?.name}</span>
                </p>
                <form onSubmit={p.handleCreateTerminal} className="space-y-4">
                  <Input 
                    label="Tên máy hiển thị *" 
                    type="text" 
                    required 
                    placeholder={t.TERMINAL_NAME_PLACEHOLDER} 
                    value={p.name} 
                    onChange={(e) => p.setName((e.target as HTMLInputElement).value)} 
                  />
                  
                  <div className="space-y-1">
                    <Input 
                      label="Mã máy POS (Tài khoản) *" 
                      type="text" 
                      required 
                      placeholder={t.TERMINAL_CODE_PLACEHOLDER} 
                      value={p.code} 
                      onChange={(e) => p.setCode((e.target as HTMLInputElement).value)} 
                    />
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 pl-1 block">
                      * Nên để dạng viết thường không dấu, không khoảng cách.
                    </span>
                  </div>

                  <div className="space-y-1 relative">
                    <Input 
                      label="Mật khẩu máy *" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder={t.TERMINAL_PASSWORD_PLACEHOLDER} 
                      value={p.password} 
                      onChange={(e) => p.setPassword((e.target as HTMLInputElement).value)} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 pl-1 block">
                      * Mật khẩu dùng để nhân viên nhập khi truy cập máy POS này.
                    </span>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
                    <Button type="button" variant="outline" fullWidth onClick={() => p.setIsAddModalOpen(false)}>Hủy</Button>
                    <Button type="submit" fullWidth className="bg-primary hover:bg-primary-light text-white font-bold flex items-center justify-center gap-2"><Save size={16} /> Tạo tài khoản</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Modal: Edit POS Machine */}
      {renderPortal(
        <AnimatePresence>
          {p.isEditModalOpen && (
            <div className="modal-wrapper">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => p.setIsEditModalOpen(false)} className="modal-overlay" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card max-w-md w-full relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-h3 flex items-center gap-3 text-gray-950 dark:text-white"><Edit2 className="text-primary" size={24} /> {t.EDIT_TERMINAL}</h3>
                  <Button onClick={() => p.setIsEditModalOpen(false)} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"><XCircle size={28} /></Button>
                </div>
                <form onSubmit={p.handleEditTerminal} className="space-y-4">
                  <Input 
                    label="Tên máy hiển thị *" 
                    type="text" 
                    required 
                    value={p.name} 
                    onChange={(e) => p.setName((e.target as HTMLInputElement).value)} 
                  />

                  <Input 
                    label="Mã máy POS (Không thể sửa)" 
                    type="text" 
                    disabled 
                    value={p.code} 
                    className="bg-gray-100 text-gray-400 dark:bg-slate-950 dark:text-slate-500 cursor-not-allowed" 
                  />

                  <div className="space-y-1 relative">
                    <Input 
                      label="Mật khẩu mới (Bỏ trống nếu không đổi)" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Nhập mật khẩu mới từ 6 ký tự..." 
                      value={p.password} 
                      onChange={(e) => p.setPassword((e.target as HTMLInputElement).value)} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-small font-semibold text-gray-700 dark:text-slate-300 ml-1">Trạng thái hoạt động *</label>
                    <select 
                      value={p.isActive ? "true" : "false"} 
                      onChange={(e) => p.setIsActive(e.target.value === "true")} 
                      className="form-input py-4 px-6 rounded-2xl text-sm font-semibold cursor-pointer"
                    >
                      <option value="true" className="dark:bg-slate-900">{t.STATUS_ACTIVE}</option>
                      <option value="false" className="dark:bg-slate-900">{t.STATUS_INACTIVE}</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/80">
                    <Button type="button" variant="outline" fullWidth onClick={() => p.setIsEditModalOpen(false)}>Hủy</Button>
                    <Button type="submit" fullWidth className="bg-primary hover:bg-primary-light text-white font-bold flex items-center justify-center gap-2"><Save size={16} /> Lưu thay đổi</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

/* ──────── Sub-components ──────── */

interface MachinesTabProps {
  terminalList: PosTerminal[];
  toggleStatus: (terminal: PosTerminal) => void;
  onEdit: (terminal: PosTerminal) => void;
  onDelete: (id: number, name: string) => void;
  t: typeof LABELS.RESTAURANT.POS_TERMINAL_MANAGER;
}

function MachinesTab({ terminalList, toggleStatus, onEdit, onDelete, t }: MachinesTabProps) {
  if (terminalList.length === 0) {
    return (
      <div className="card-container text-center py-16 text-gray-400">
        <Monitor className="mx-auto text-gray-300 mb-3 animate-pulse" size={48} />
        <span className="text-sm font-bold block">{t.NO_TERMINALS}</span>
      </div>
    );
  }

  return (
    <div className="card-container overflow-x-auto w-full custom-scrollbar">
      <table className="w-full text-left">
        <thead>
          <tr className="table-header-row">
            <th className="px-8 py-5 font-bold">{t.TERMINAL_NAME}</th>
            <th className="px-8 py-5 font-bold">{t.TERMINAL_CODE}</th>
            <th className="px-8 py-5 font-bold">Người đang sử dụng</th>
            <th className="px-8 py-5 font-bold text-center">{t.STATUS}</th>
            <th className="px-8 py-5 font-bold text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {terminalList.map((terminal) => {
            return (
              <tr key={terminal.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Tv size={20} />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-slate-100 text-base">
                      {terminal.name}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 font-mono text-xs font-semibold text-gray-650 dark:text-slate-350">
                  {terminal.code}
                </td>
                <td className="px-8 py-5 font-medium">
                  {terminal.currentUserId ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/35 rounded-xl">
                      <Clock size={12} /> Đang hoạt động
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs font-medium">Trống (Sẵn sàng)</span>
                  )}
                </td>
                <td className="px-8 py-5 text-center">
                  <button 
                    onClick={() => toggleStatus(terminal)} 
                    className={`badge-status hover:scale-[1.02] cursor-pointer select-none transition-all ${
                      terminal.isActive 
                        ? 'bg-green-50 text-green-600 border-green-100 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50' 
                        : 'bg-red-50 text-red-600 border-red-100 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50'
                    }`}
                  >
                    {terminal.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </button>
                </td>
                <td className="px-8 py-5">
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEdit(terminal)} 
                      className="text-blue-600 dark:text-blue-400" 
                      title={t.EDIT_TERMINAL}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onDelete(terminal.id, terminal.name)} 
                      className="text-red-600 dark:text-rose-450" 
                      title="Xóa máy POS"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface LogsTabProps {
  logList: PosTerminalLog[];
  t: typeof LABELS.RESTAURANT.POS_TERMINAL_MANAGER;
}

function LogsTab({ logList, t }: LogsTabProps) {
  if (logList.length === 0) {
    return (
      <div className="card-container text-center py-16 text-gray-400">
        <History className="mx-auto text-gray-300 mb-3" size={48} />
        <span className="text-sm font-bold block">{t.NO_LOGS}</span>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN');
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-green-50 text-green-600 dark:bg-emerald-950/30 dark:text-emerald-400">Đăng nhập</span>;
      case 'LOGIN_OVERRIDE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">Chiếm phiên</span>;
      case 'LOGOUT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400">Đăng xuất</span>;
      case 'CREATE_ORDER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">Thanh toán</span>;
      case 'CREATE_TERMINAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">Tạo máy</span>;
      case 'UPDATE_TERMINAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">Cập nhật</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-500">{action}</span>;
    }
  };

  return (
    <div className="card-container overflow-x-auto w-full custom-scrollbar">
      <table className="w-full text-left">
        <thead>
          <tr className="table-header-row">
            <th className="px-8 py-5 font-bold">{t.LOG_COLUMNS.TIME}</th>
            <th className="px-8 py-5 font-bold">{t.LOG_COLUMNS.TERMINAL}</th>
            <th className="px-8 py-5 font-bold">{t.LOG_COLUMNS.USER}</th>
            <th className="px-8 py-5 font-bold">{t.LOG_COLUMNS.ACTION}</th>
            <th className="px-8 py-5 font-bold">{t.LOG_COLUMNS.DETAILS}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {logList.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-all text-sm text-gray-800 dark:text-slate-200">
              <td className="px-8 py-5 text-gray-400 font-medium">
                {formatTime(log.createdAt)}
              </td>
              <td className="px-8 py-5 font-bold text-gray-700 dark:text-slate-350">
                {log.terminal?.name || `Máy ID: ${log.terminalId}`}
              </td>
              <td className="px-8 py-5 font-bold">
                <div>
                  <span className="block text-gray-800 dark:text-slate-200">{log.user?.name}</span>
                  <span className="text-xs text-gray-400 font-medium">{log.user?.email}</span>
                </div>
              </td>
              <td className="px-8 py-5">
                {getActionBadge(log.action)}
              </td>
              <td className="px-8 py-5 font-medium text-gray-600 dark:text-slate-400 max-w-xs truncate" title={log.details}>
                {log.details}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
