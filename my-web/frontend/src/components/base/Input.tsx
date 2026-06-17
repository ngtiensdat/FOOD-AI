'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  isTextArea?: boolean;
}

export const Input = ({
  label,
  icon: Icon,
  error,
  isTextArea = false,
  className = '',
  ...props
}: InputProps) => {
  const inputStyles = `w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 ${
    Icon ? 'pl-12' : 'px-6'
  } pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all text-sm`;

  const TextAreaComponent = 'textarea' as any;
  const InputComponent = isTextArea ? TextAreaComponent : 'input';

  return (
    <div className="space-y-2">
      {label && <label className="text-small font-semibold text-gray-700 ml-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" 
            size={20} 
          />
        )}
        <InputComponent
          suppressHydrationWarning
          className={`${inputStyles} ${className} ${isTextArea ? 'min-h-[100px]' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{error}</p>}
    </div>
  );
};
