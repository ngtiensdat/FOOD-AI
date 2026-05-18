'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Lấy theme đã lưu hoặc theo cấu hình hệ thống
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const activeTheme = savedTheme || systemTheme;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(activeTheme);
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    };

    // Tránh hiện tượng Hydration Mismatch bằng cách chỉ render children khi đã mounted ở client
    if (!mounted) {
        return <div className="invisible">{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
