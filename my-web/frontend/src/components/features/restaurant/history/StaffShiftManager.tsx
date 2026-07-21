/**
 * Mục đích file này để làm gì: Component hiển thị danh sách các ca làm việc của nhân viên thu ngân máy POS.
 * Các file khác hay file này có ý nghĩa như thế nào: Được nhúng trong HistoryManager nhằm quản lý thời gian phục vụ, doanh thu thu về của nhân viên theo từng ca làm việc.
 * Các chức năng đặc biệt: Tự động phân loại ca đang chạy và ca đã đóng, tính toán doanh thu ca trực, hiển thị tên máy POS kết nối.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { historyService, StaffShift } from '@/services/history.service';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { Button } from '@/components/base/Button';
import { User, LogIn, LogOut, ShoppingBag, DollarSign, Monitor } from 'lucide-react';

interface StaffShiftManagerProps {
  restaurantId: number;
}

export function StaffShiftManager({ restaurantId }: StaffShiftManagerProps) {
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const data = await historyService.getStaffShifts(restaurantId);
      setShifts(data);
    } catch (e: any) {
      console.error('Lỗi khi tải ca làm việc:', e);
      toast.error('Không thể tải danh sách ca làm việc nhân viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchShifts();
  }, [restaurantId]);

  return (
    <div className="space-y-6">
      {/* Bảng danh sách ca làm việc */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-850 flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-800 dark:text-slate-100">Lịch sử ca làm việc nhân viên POS</h3>
          <Button onClick={fetchShifts} size="sm" variant="outline" className="text-xs font-bold py-2">Làm mới</Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-400 font-bold text-xs">Đang tải lịch sử ca làm việc...</div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-16 text-gray-400 font-bold text-xs">Không có dữ liệu ca làm việc.</div>
          ) : (
            <table className="w-full text-left text-xs font-semibold text-gray-700 dark:text-slate-300">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-950/40 text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-slate-850">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Máy POS</th>
                  <th className="px-6 py-4">Giờ bắt đầu</th>
                  <th className="px-6 py-4">Giờ kết thúc</th>
                  <th className="px-6 py-4 text-center">Số đơn trong ca</th>
                  <th className="px-6 py-4 text-right">Doanh thu ca</th>
                  <th className="px-6 py-4 text-center">Trạng thái ca</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-850">
                {shifts.map((shift) => {
                  const isActive = !shift.clockOut;
                  return (
                    <tr key={shift.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-1.5 pt-4">
                        <User size={14} className="text-gray-400" />
                        {shift.staffName}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {shift.terminalName ? (
                          <span className="flex items-center gap-1">
                            <Monitor size={12} className="text-gray-400" />
                            {shift.terminalName}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <LogIn size={12} className="text-emerald-500" />
                          {new Date(shift.clockIn).toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium">
                        {shift.clockOut ? (
                          <span className="flex items-center gap-1">
                            <LogOut size={12} className="text-rose-500" />
                            {new Date(shift.clockOut).toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold italic">Đang chạy ca...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-gray-900 dark:text-white">
                        <span className="flex items-center gap-1 justify-center">
                          <ShoppingBag size={12} className="text-gray-450" />
                          {shift.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1 justify-end">
                          <DollarSign size={12} className="text-emerald-500" />
                          {formatCurrency(shift.totalRevenue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black rounded-lg border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                            : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800'
                        }`}>
                          {isActive ? 'ĐANG PHỤC VỤ' : 'ĐÃ ĐÓNG CA'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
