'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Sparkles } from 'lucide-react';

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
    <button onClick={onClick} className={`${baseStyles} ${active ? activeStyles : (variant === 'danger' ? dangerStyles : inactiveStyles)}`}>
      {content}
    </button>
  );
};

interface SidebarProps {
  brandIcon?: LucideIcon;
  brandLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sidebar = ({ brandIcon: BrandIcon = Sparkles, brandLabel = "Food AI", children, footer }: SidebarProps) => {
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
