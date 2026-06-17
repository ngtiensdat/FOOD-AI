// Mục đích: Cung cấp Context quản lý chế độ hiển thị giao diện (Theme) bao gồm các chế độ light, dark và mixed.
// Ý nghĩa: Đóng vai trò là Provider trung tâm phân phối trạng thái theme đến toàn bộ các component trong ứng dụng.
// Chức năng đặc biệt: Tự động tải và lưu theme từ localStorage, hỗ trợ chế độ mixed (trộn trung hòa) và chuyển đổi tuần hoàn.
// Design Pattern: Context Pattern, Custom Hook pattern, Provider Pattern.
// Biến, hàm đặc biệt: ThemeProvider, useTheme, applyTheme, toggleTheme.

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'mixed';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>('light');

    const applyTheme = (t: Theme) => {
        document.documentElement.classList.remove('dark', 'mixed');
        if (t === 'mixed') {
            document.documentElement.classList.add('mixed');
        } else if (t === 'dark') {
            document.documentElement.classList.add('dark');
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const activeTheme = savedTheme || 'light';

        setThemeState(activeTheme);
        applyTheme(activeTheme);
    }, []);

    const setTheme = (nextTheme: Theme) => {
        setThemeState(nextTheme);
        localStorage.setItem('theme', nextTheme);
        applyTheme(nextTheme);
    };

    const toggleTheme = () => {
        let nextTheme: Theme = 'mixed';
        if (theme === 'mixed') {
            nextTheme = 'dark';
        } else if (theme === 'dark') {
            nextTheme = 'light';
        } else {
            nextTheme = 'mixed';
        }
        setTheme(nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
