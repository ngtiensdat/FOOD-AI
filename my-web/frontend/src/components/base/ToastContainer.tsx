/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) quản lý và hiển thị danh sách các thông báo nổi (Toast) trên toàn hệ thống.
 * Các file khác hay file này có ý nghĩa như nào: Hoạt động như một Global Component, lắng nghe dữ liệu từ Zustand store (`useToastStore`). Bạn chỉ cần gọi hàm `addToast` ở bất kỳ đâu, component này sẽ tự động bắt và render lên góc màn hình.
 * Các chức năng đặc biệt: Ứng dụng `AnimatePresence` của `framer-motion` để tạo ra hiệu ứng bay vào/bay ra trơn tru. Hỗ trợ hiển thị 3 trạng thái: success, error, info với màu sắc và icon riêng biệt.
 * Các biến, hàm đặc biệt trong file: `z-[200]` đảm bảo các thông báo luôn đè lên tất cả các thành phần khác kể cả Modal.
 */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/useToastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { LABELS } from '@/constants/labels';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`flex items-center gap-4 p-5 rounded-2xl shadow-xl min-w-[320px] backdrop-blur-md border ${toast.type === 'success' ? 'bg-green-50/90 text-green-700 border-green-100' :
              toast.type === 'error' ? 'bg-red-50/90 text-red-700 border-red-100' :
                'bg-blue-50/90 text-blue-700 border-blue-100'
              }`}
          >
            {toast.type === 'success' && <CheckCircle className="text-green-500" size={24} />}
            {toast.type === 'error' && <XCircle className="text-red-500" size={24} />}
            {toast.type === 'info' && <Info className="text-blue-500" size={24} />}

            <p className="flex-1 font-bold text-body leading-tight">{toast.message}</p>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
              aria-label={LABELS.COMMON.CLOSE}
            >
              <X size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
