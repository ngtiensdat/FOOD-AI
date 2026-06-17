// Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) hiển thị Nút chuyển đổi giao diện Sáng/Tối/Pha trộn (Dark/Light/Mixed mode).
// Các file khác hay file này có ý nghĩa như nào: Là một thành phần UI tương tác trên Navbar, kết nối trực tiếp với Context useTheme.
// Các chức năng đặc biệt: Sử dụng framer-motion để tạo hiệu ứng xoay (rotate) và phóng to/thu nhỏ (scale) mượt mà cho icon Sun/Moon, tự đổi màu Moon thành xanh chàm khi ở chế độ Mixed.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: React Context, Presentational Component Pattern, Declarative Animation.
// Các biến, hàm đặc biệt trong file: ThemeToggle component.
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
                animate={{ rotate: theme === 'dark' ? 90 : theme === 'mixed' ? 45 : 0, scale: theme === 'light' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute"
            >
                <Sun size={20} className="text-orange-500" />
            </motion.div>

            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 0 : theme === 'mixed' ? -45 : -90, scale: theme === 'light' ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                className="absolute"
            >
                <Moon size={20} className={theme === 'mixed' ? "text-indigo-400" : "text-blue-400"} />
            </motion.div>
        </motion.button>
    );
};
