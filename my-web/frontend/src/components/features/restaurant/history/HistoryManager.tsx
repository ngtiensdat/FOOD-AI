/**
 * Mục đích file này để làm gì: Quản lý tab chính chứa các báo cáo, lịch sử liên quan đến máy POS.
 * Các file khác hay file này có ý nghĩa như thế nào: Tích hợp vào Restaurant Admin page để người dùng quản lý đa chi nhánh chọn xem báo cáo doanh thu, hóa đơn hoặc ca trực.
 * Các chức năng đặc biệt: Chuyển đổi tab linh hoạt bằng Framer Motion, lọc doanh thu theo chi nhánh.
 */
'use client';

import React, { useState } from 'react';
import { BarChart3, Receipt, Users2, History } from 'lucide-react';
import { Restaurant } from '@/types/restaurant';
import { SalesReportManager } from './SalesReportManager';
import { OrderHistoryManager } from './OrderHistoryManager';
import { StaffShiftManager } from './StaffShiftManager';

export type HistoryTab = 'sales' | 'orders' | 'shifts';

interface HistoryManagerProps {
  restaurant: Restaurant | null;
  myBranches: Restaurant[];
  selectedSubTab?: HistoryTab;
  onSubTabChange?: (tabId: HistoryTab) => void;
}

export function HistoryManager({ restaurant, myBranches, selectedSubTab = 'sales', onSubTabChange }: HistoryManagerProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>(selectedSubTab);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(restaurant?.id || (myBranches[0]?.id) || 0);

  const handleTabChange = (tabId: HistoryTab) => {
    setActiveTab(tabId);
    if (onSubTabChange) onSubTabChange(tabId);
  };

  const currentBranchId = selectedBranchId || restaurant?.id || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <History className="text-primary" size={24} />
            Báo cáo & Lịch sử POS
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Xem báo cáo doanh số chi tiết, nhật ký đơn hàng và lịch sử ca trực của nhân viên POS.
          </p>
        </div>

        {/* Branch Selector */}
        {myBranches.length > 1 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-850 px-3.5 py-2 rounded-2xl shadow-sm shrink-0">
            <span className="text-xs font-black text-gray-400">Chi nhánh:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {myBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-slate-950/40 p-1.5 rounded-2xl w-max border border-gray-150 dark:border-slate-850 font-bold text-xs">
        {[
          { id: 'sales', label: 'Báo cáo Doanh số', icon: BarChart3 },
          { id: 'orders', label: 'Lịch sử Đơn hàng', icon: Receipt },
          { id: 'shifts', label: 'Ca trực nhân viên', icon: Users2 }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as HistoryTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                  : 'text-gray-500 hover:text-gray-750 dark:hover:text-slate-350'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'sales' && currentBranchId > 0 && (
          <SalesReportManager restaurantId={currentBranchId} />
        )}
        {activeTab === 'orders' && currentBranchId > 0 && (
          <OrderHistoryManager restaurantId={currentBranchId} />
        )}
        {activeTab === 'shifts' && currentBranchId > 0 && (
          <StaffShiftManager restaurantId={currentBranchId} />
        )}
      </div>
    </div>
  );
}
