/**
 * Mục đích file này để làm gì: Component vẽ biểu đồ doanh số và bảng thống kê doanh số chi tiết theo ngày.
 * Các file khác hay file này có ý nghĩa như thế nào: Được hiển thị bên trong HistoryManager để cung cấp báo cáo doanh số cho chủ nhà hàng.
 * Các chức năng đặc biệt: Vẽ biểu đồ cột trực quan bằng Tailwind CSS, lọc khoảng ngày tùy chỉnh, tự động tính tổng doanh số và tỷ trọng tiền mặt / chuyển khoản.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, DollarSign, CreditCard, ShoppingBag, Percent } from 'lucide-react';
import { historyService, DailySalesSummary } from '@/services/history.service';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { toast } from '@/store/useToastStore';

interface SalesReportManagerProps {
  restaurantId: number;
}

export function SalesReportManager({ restaurantId }: SalesReportManagerProps) {
  const [sales, setSales] = useState<DailySalesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date filter (Default: last 30 days)
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await historyService.getDailySales(restaurantId, from, to);
      // Sắp xếp tăng dần theo ngày để vẽ biểu đồ
      const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
      setSales(sorted);
    } catch (e: any) {
      console.error('Lỗi tải báo cáo doanh số:', e);
      toast.error('Không thể tải báo cáo doanh số.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchSales();
  }, [restaurantId]);

  // Tính tổng
  const totalRevenue = sales.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalOrders = sales.reduce((sum, item) => sum + item.totalOrders, 0);
  const totalCash = sales.reduce((sum, item) => sum + item.cashRevenue, 0);
  const totalTransfer = sales.reduce((sum, item) => sum + item.transferRevenue, 0);
  const totalDiscount = sales.reduce((sum, item) => sum + item.totalDiscount, 0);

  // Tìm mức doanh thu cao nhất để scale biểu đồ
  const maxRevenue = Math.max(...sales.map(s => s.totalRevenue), 1);

  return (
    <div className="space-y-6">
      {/* Bộ lọc */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row items-end gap-4 shadow-sm">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <Input 
            label="Từ ngày" 
            type="date" 
            value={from} 
            onChange={(e) => setFrom((e.target as HTMLInputElement).value)} 
          />
          <Input 
            label="Đến ngày" 
            type="date" 
            value={to} 
            onChange={(e) => setTo((e.target as HTMLInputElement).value)} 
          />
        </div>
        <Button 
          onClick={fetchSales} 
          disabled={loading}
          className="bg-primary hover:bg-primary-light text-white font-bold px-6 py-3.5 rounded-2xl w-full md:w-auto"
        >
          Lọc báo cáo
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Tổng Doanh Thu', val: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Tổng Số Đơn', val: `${totalOrders} đơn`, icon: ShoppingBag, color: 'text-primary bg-orange-50 dark:bg-orange-950/20' },
          { title: 'Tiền mặt / Chuyển khoản', val: `${formatCurrency(totalCash)} / ${formatCurrency(totalTransfer)}`, icon: CreditCard, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
          { title: 'Khuyến mãi đã áp dụng', val: formatCurrency(totalDiscount), icon: Percent, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:scale-[1.01] transition-transform">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${kpi.color}`}>
              <kpi.icon size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">{kpi.title}</span>
              <span className="text-sm font-black text-gray-800 dark:text-slate-100 block mt-0.5">{kpi.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ Doanh Thu */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
          <BarChart3 size={16} /> Biểu đồ doanh thu theo ngày
        </h3>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs font-bold text-gray-400">Đang tải biểu đồ...</div>
        ) : sales.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs font-bold text-gray-400">Không có dữ liệu trong khoảng thời gian này.</div>
        ) : (
          <div className="flex items-end gap-3 h-64 overflow-x-auto pt-6 px-4 select-none scrollbar-thin scrollbar-thumb-gray-200">
            {sales.map((item, idx) => {
              const heightPercent = (item.totalRevenue / maxRevenue) * 100;
              const formattedDate = item.date.split('-').slice(1).reverse().join('/'); // DD/MM
              return (
                <div key={idx} className="flex flex-col items-center flex-1 min-w-[36px] group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-950 text-white text-[10px] font-extrabold py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-md">
                    <div>{formattedDate}</div>
                    <div className="text-emerald-450 mt-0.5">{formatCurrency(item.totalRevenue)}</div>
                    <div className="text-gray-400 font-bold text-[9px] mt-0.5">{item.totalOrders} đơn hàng</div>
                  </div>

                  {/* Bar */}
                  <div 
                    style={{ height: `${Math.max(heightPercent, 3)}%` }} 
                    className="w-7 rounded-t-lg bg-primary/25 group-hover:bg-primary transition-colors cursor-pointer relative"
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-primary h-1 rounded-t-lg" />
                  </div>
                  
                  {/* Label */}
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-extrabold mt-2.5 whitespace-nowrap">{formattedDate}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bảng chi tiết */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-850">
          <h3 className="text-sm font-black text-gray-800 dark:text-slate-100">Bảng chi tiết doanh số</h3>
        </div>
        <div className="overflow-x-auto">
          {sales.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold text-xs">Chưa có bản ghi nào.</div>
          ) : (
            <table className="w-full text-left text-xs font-semibold text-gray-700 dark:text-slate-300">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-950/40 text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-slate-850">
                  <th className="px-6 py-4">Ngày</th>
                  <th className="px-6 py-4 text-right">Tổng Doanh Thu</th>
                  <th className="px-6 py-4 text-center">Số Đơn Hoàn Thành</th>
                  <th className="px-6 py-4 text-right">Tiền Mặt</th>
                  <th className="px-6 py-4 text-right">Chuyển Khoản</th>
                  <th className="px-6 py-4 text-right">Tổng Khuyến Mãi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-850">
                {sales.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      {item.date.split('-').reverse().join('/')}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(item.totalRevenue)}</td>
                    <td className="px-6 py-4 text-center text-gray-900 dark:text-white font-black">{item.totalOrders}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(item.cashRevenue)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(item.transferRevenue)}</td>
                    <td className="px-6 py-4 text-right text-rose-500 font-bold">-{formatCurrency(item.totalDiscount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
