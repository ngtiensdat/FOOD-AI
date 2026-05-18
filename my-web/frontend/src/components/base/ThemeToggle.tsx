import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer shadow-sm relative overflow-hidden h-10 w-10 flex items-center justify-center"
            aria-label="Toggle Theme"
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
