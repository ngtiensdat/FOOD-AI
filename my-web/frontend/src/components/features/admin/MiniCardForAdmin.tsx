'use client';

// Mục đích file này: Hiển thị một thẻ dòng (Row Layout 1x1) trực quan phục vụ giao diện quản trị admin.
// Các file khác hay file này có ý nghĩa như nào: Được sử dụng làm thẻ hiển thị món ăn/đối tác trong các sub-tables quản trị.

import React from 'react';
import SafeImage from '@/components/base/SafeImage';
import { ShoppingBag } from 'lucide-react';
import { getValidImageUrl } from '@/utils/helpers';
import { Button } from '@/components/base/Button';

export interface AdminCardAction {
  label: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'purple';
  title?: string;
  active?: boolean;
}

export interface MiniCardForAdminProps {
  id: string | number;
  title: string;
  subtitle?: string | React.ReactNode;
  image?: string;
  fallbackIcon?: React.ReactNode;
  meta?: Array<{
    label: string | React.ReactNode;
    type?: 'primary' | 'secondary' | 'success' | 'danger' | 'neutral' | 'purple';
  }>;
  actions?: AdminCardAction[];
  onClick?: () => void;
}

export function MiniCardForAdmin({
  title,
  subtitle,
  image,
  fallbackIcon,
  meta,
  actions = [],
  onClick,
}: MiniCardForAdminProps) {
  // Helper to determine badge classes based on metadata type
  const getBadgeClass = (type: string = 'neutral') => {
    switch (type) {
      case 'primary':
        return 'bg-orange-50 text-primary border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50';
      case 'secondary':
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50';
      case 'success':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'danger':
        return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50';
    }
  };

  // Helper to determine action button styling based on variant and active state
  const getActionButtonClass = (action: AdminCardAction) => {
    const base = 'p-2 rounded-xl transition-all duration-200 border flex items-center justify-center';
    if (action.active) {
      switch (action.variant) {
        case 'primary':
          return `${base} bg-primary text-white border-transparent hover:bg-orange-600`;
        case 'secondary':
          return `${base} bg-blue-600 text-white border-transparent hover:bg-blue-700`;
        case 'danger':
          return `${base} bg-rose-600 text-white border-transparent hover:bg-rose-700`;
        case 'success':
          return `${base} bg-emerald-600 text-white border-transparent hover:bg-emerald-700`;
        case 'purple':
          return `${base} bg-purple-600 text-white border-transparent hover:bg-purple-700`;
        default:
          return `${base} bg-gray-600 text-white border-transparent hover:bg-gray-700`;
      }
    } else {
      switch (action.variant) {
        case 'primary':
          return `${base} bg-orange-50/50 text-primary border-orange-100 hover:bg-primary hover:text-white dark:bg-orange-950/10 dark:border-orange-900/30`;
        case 'secondary':
          return `${base} bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white dark:bg-blue-950/10 dark:border-blue-900/30`;
        case 'danger':
          return `${base} bg-rose-50/50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white dark:bg-rose-950/10 dark:border-rose-900/30`;
        case 'success':
          return `${base} bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/10 dark:border-emerald-900/30`;
        case 'purple':
          return `${base} bg-purple-50/50 text-purple-600 border-purple-100 hover:bg-purple-600 hover:text-white dark:bg-purple-950/10 dark:border-purple-900/30`;
        case 'ghost':
          return `${base} bg-transparent text-gray-500 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-400`;
        default:
          return `${base} bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800`;
      }
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  // Layout 1x1: Dạng thước kẻ nằm ngang phẳng (Row Layout) - Mặc định duy nhất
  return (
    <div 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-950 hover:bg-orange-50/20 dark:hover:bg-slate-900/10 border border-gray-100 dark:border-slate-800 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md group ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary' : ''}`}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Ảnh nhỏ vuông gọn 3x3 cm */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-slate-800 border border-gray-50 dark:border-slate-800">
          {image ? (
            <SafeImage 
              src={getValidImageUrl(image)} 
              alt={title} 
              fill 
              sizes="64px"
              className="object-cover group-hover:scale-105 transition-transform duration-350" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-700 bg-gray-50 dark:bg-slate-900">
              {fallbackIcon || <ShoppingBag size={20} />}
            </div>
          )}
        </div>

        {/* Nội dung thông tin cơ bản */}
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-baseline gap-2">
            <h4 className="font-extrabold text-gray-800 dark:text-slate-200 text-sm md:text-base group-hover:text-primary transition-colors line-clamp-1">
              {title}
            </h4>
          </div>
          
          {subtitle && (
            <div className="text-gray-400 dark:text-slate-500 text-xs line-clamp-1 mt-0.5 mb-1.5">
              {subtitle}
            </div>
          )}

          {/* Badges hiển thị siêu dữ liệu */}
          {meta && meta.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {meta.map((tag, idx) => (
                <span 
                  key={`meta-tag-${idx}`}
                  className={`px-2 py-0.5 text-[9px] md:text-[10px] font-extrabold border rounded-md ${getBadgeClass(tag.type)}`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vùng chứa các nút quản lý căn phải */}
      {actions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {actions.map((action, idx) => (
            <Button
              key={`act-${idx}`}
              onClick={action.onClick}
              variant="none"
              size="none"
              className={getActionButtonClass(action)}
              aria-label={action.label}
              title={action.title || action.label}
            >
              {action.icon}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
