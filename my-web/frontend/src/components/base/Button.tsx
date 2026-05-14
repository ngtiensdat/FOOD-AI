'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'red';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'gradient-bg text-white shadow-lg hover:brightness-110 active:scale-95',
    secondary: 'bg-orange-50 text-primary hover:bg-orange-100 active:scale-95',
    ghost: 'hover:bg-gray-100 text-gray-500 active:scale-95',
    outline: 'border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary active:scale-95',
    red: 'bg-red-500 text-white shadow-lg hover:bg-red-600 active:scale-95',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-button',
    md: 'px-6 py-2.5 text-sm rounded-button',
    lg: 'px-8 py-4 text-body rounded-button',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Đang xử lý...</span>
        </div>
      ) : children}
    </motion.button>
  );
};
