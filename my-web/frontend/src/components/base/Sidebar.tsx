/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) hiển thị Thanh điều hướng bên (Sidebar) và các mục menu con (SidebarItem).
 * Các file khác hay file này có ý nghĩa như nào: Là một thành phần UI thuần, cung cấp layout điều hướng cố định (fixed) bên trái. Được dùng chủ yếu trong trang Admin hoặc Dashboard.
 * Các chức năng đặc biệt: `SidebarItem` thông minh tự động nhận diện nếu có truyền `href` thì render thẻ `<Link>` để chuyển trang tối ưu trong Next.js, nếu không sẽ tự động render thẻ `<Button>`. Hỗ trợ biến thể `danger` cho các thao tác nguy hiểm (vd: Đăng xuất).
 * Các biến, hàm đặc biệt trong file: Mặc định tự gọi `LABELS.COMMON.BRAND_NAME` cho logo/tên thương hiệu để đảm bảo nguyên tắc Zero Hardcode.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Sparkles } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Button } from '@/components/base/Button';

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  variant?: 'default' | 'danger';
}

export const SidebarItem = ({ icon: Icon, label, href, onClick, active, variant = 'default' }: SidebarItemProps) => {
  const baseStyles = "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-small";
  const activeStyles = "bg-orange-50 text-primary shadow-sm shadow-orange-100";
  const inactiveStyles = "text-gray-400 hover:bg-gray-50 hover:text-gray-600";
  const dangerStyles = "text-red-400 hover:bg-red-50 hover:text-red-500";

  const content = (
    <>
      <Icon size={20} />
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseStyles} ${active ? activeStyles : (variant === 'danger' ? dangerStyles : inactiveStyles)}`}>
        {content}
      </Link>
    );
  }

  return (
    <Button onClick={onClick} variant="none" size="none" className={`${baseStyles} ${active ? activeStyles : (variant === 'danger' ? dangerStyles : inactiveStyles)}`}>
      {content}
    </Button>
  );
};

interface SidebarProps {
  brandIcon?: LucideIcon;
  brandLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sidebar = ({ brandIcon: BrandIcon = Sparkles, brandLabel = LABELS.COMMON.BRAND_NAME, children, footer }: SidebarProps) => {
  return (
    <aside className="w-80 bg-white border-r border-gray-100 flex flex-col p-8 fixed h-full z-20">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg">
          <BrandIcon size={24} />
        </div>
        <span className="text-2xl font-bold gradient-text tracking-tight">{brandLabel}</span>
      </div>

      <nav className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {children}
      </nav>

      {footer && (
        <div className="mt-auto pt-6 border-t border-gray-50 space-y-2">
          {footer}
        </div>
      )}
    </aside>
  );
};
