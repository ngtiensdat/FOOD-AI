/**
 * Mục đích file này để làm gì: Component hiển thị danh sách lịch sử đơn hàng của nhà hàng và hiển thị chi tiết hóa đơn trong một modal popup.
 * Các file khác hay file này có ý nghĩa như thế nào: Được hiển thị bên trong HistoryManager để nhân viên/quản lý tra cứu lịch sử mua hàng của khách.
 * Các chức năng đặc biệt: Phân tách hóa đơn thanh toán tiền mặt và chuyển khoản, hiển thị chi tiết từng món ăn đã đặt cùng thông tin nhân viên phục vụ, bàn ăn và voucher áp dụng.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { historyService, OrderHistory } from '@/services/history.service';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { Calendar, Users, Eye, X, Receipt, ShoppingCart, Tag, CreditCard } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderHistoryManagerProps {
  restaurantId: number;
}

export function OrderHistoryManager({ restaurantId }: OrderHistoryManagerProps) {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderHistory | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await historyService.getOrderHistories(restaurantId);
      setOrders(data);
    } catch (e: any) {
      console.error('Lỗi khi tải lịch sử đơn hàng:', e);
      toast.error('Không thể tải danh sách lịch sử đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchOrders();
  }, [restaurantId]);

  return (
    <div className="space-y-6">
      {/* Bảng danh sách đơn hàng */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-850 flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-800 dark:text-slate-100">Lịch sử đơn hàng POS</h3>
          <Button onClick={fetchOrders} size="sm" variant="outline" className="text-xs font-bold py-2">Làm mới</Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-400 font-bold text-xs">Đang tải lịch sử...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400 font-bold text-xs">Không có dữ liệu đơn hàng.</div>
          ) : (
            <table className="w-full text-left text-xs font-semibold text-gray-700 dark:text-slate-300">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-950/40 text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-slate-850">
                  <th className="px-6 py-4">Mã Đơn (PG)</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Bàn ăn</th>
                  <th className="px-6 py-4">Nhân viên phục vụ</th>
                  <th className="px-6 py-4 text-right">Tổng Cộng</th>
                  <th className="px-6 py-4 text-center">Thanh toán</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-850">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">#{order.orderId}</td>
                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{order.tableName || 'Mang về'}</td>
                    <td className="px-6 py-4 flex items-center gap-1.5 pt-4 text-gray-500">
                      <Users size={14} className="text-gray-400" />
                      {order.staffName || 'Hệ thống'}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-primary">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg border ${
                        order.paymentMethod === 'TRANSFER'
                          ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-450 dark:border-blue-900/50'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                      }`}>
                        <CreditCard size={10} />
                        {order.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary border-primary/20 hover:bg-primary/5 flex items-center gap-1 mx-auto py-1 px-2.5 rounded-lg text-[10px]"
                      >
                        <Eye size={12} /> Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal chi tiết hóa đơn */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedOrder(null)} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full relative z-10 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt size={20} className="text-primary" />
                  Chi tiết hóa đơn #{selectedOrder.orderId}
                </h3>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-gray-650 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Thông tin chung */}
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-850 p-4 rounded-2xl">
                <div>
                  <span className="block text-gray-400 text-[10px] uppercase">Thời gian</span>
                  <span className="text-gray-800 dark:text-slate-200 mt-0.5 block">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div>
                  <span className="block text-gray-400 text-[10px] uppercase">Bàn phục vụ</span>
                  <span className="text-gray-800 dark:text-slate-200 mt-0.5 block">{selectedOrder.tableName || 'Mang về'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 text-[10px] uppercase">Nhân viên</span>
                  <span className="text-gray-800 dark:text-slate-200 mt-0.5 block">{selectedOrder.staffName || 'Hệ thống'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 text-[10px] uppercase">Thanh toán</span>
                  <span className="text-gray-800 dark:text-slate-200 mt-0.5 block">{selectedOrder.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <ShoppingCart size={12} /> Danh sách món ăn
                </span>
                <div className="border border-gray-100 dark:border-slate-850 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-slate-850">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 text-xs font-bold hover:bg-gray-50/30 dark:hover:bg-slate-950/20">
                      <div>
                        <span className="text-gray-850 dark:text-slate-200 block">{item.foodName}</span>
                        <span className="text-gray-400 text-[10px] font-medium block mt-0.5">{formatCurrency(item.price)} x {item.quantity}</span>
                      </div>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng thanh toán */}
              <div className="border-t border-gray-150 dark:border-slate-850 pt-4 text-xs font-bold space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      Voucher giảm giá ({selectedOrder.voucherCode || ''}):
                    </span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-900 dark:text-white border-t border-gray-100 dark:border-slate-850 pt-2">
                  <span>Tổng thanh toán:</span>
                  <span className="text-primary text-base font-black">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={() => setSelectedOrder(null)} fullWidth>Đóng</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
