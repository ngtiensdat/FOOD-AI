/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) hiển thị Nút chuyển đổi giao diện Sáng/Tối (Dark/Light mode).
 * Các file khác hay file này có ý nghĩa như nào: Là một thành phần UI tương tác kết nối trực tiếp với Context `useTheme`. Sử dụng `framer-motion` để tạo hiệu ứng xoay (rotate) và phóng to/thu nhỏ (scale) khi đổi theme.
 * Các chức năng đặc biệt: Hoạt động mượt mà bằng cách gối 2 icon Sun và Moon lên nhau (`absolute`) và thay đổi `scale` nghịch đảo nhau tuỳ theo trạng thái theme. Bắt buộc phải là Client Component.
 * Các biến, hàm đặc biệt trong file: Sử dụng `LABELS.COMMON.TOGGLE_THEME` cho `aria-label` để thân thiện với trình đọc màn hình.
 */
'use client';

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { LABELS } from '@/constants/labels';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer shadow-sm relative overflow-hidden h-10 w-10 flex items-center justify-center"
            aria-label={LABELS.COMMON.TOGGLE_THEME}
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 90 : 0, scale: theme === 'dark' ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                className="absolute"
            >
                <Sun size={20} className="text-orange-500" />
            </motion.div>

            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 0 : -90, scale: theme === 'dark' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute"
            >
                <Moon size={20} className="text-blue-400" />
            </motion.div>
        </motion.button>
    );
};
