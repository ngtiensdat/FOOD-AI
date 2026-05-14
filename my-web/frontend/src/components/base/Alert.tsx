'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Alert = ({ type, children, className = '' }: AlertProps) => {
  const configs = {
    error: {
      bg: 'bg-red-50',
      text: 'text-red-500',
      border: 'border-red-100',
      icon: <AlertCircle size={20} />
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-100',
      icon: <CheckCircle2 size={20} />
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      icon: <Info size={20} />
    }
  };

  const config = configs[type];

  return (
    <div className={`${config.bg} ${config.text} ${config.border} p-4 rounded-xl text-sm mb-6 border font-bold flex items-center gap-3 ${className}`}>
      {config.icon}
      {children}
    </div>
  );
};
