/**
 * Mục đích file này để làm gì: Component giao diện cơ bản (Base UI) hiển thị Thanh điều hướng bên (Sidebar) và các mục menu con (SidebarItem).
 * Các file khác hay file này có ý nghĩa như nào: Là một thành phần UI thuần, cung cấp layout điều hướng cố định (fixed) bên trái. Được dùng chủ yếu trong trang Admin hoặc Dashboard.
 * Các chức năng đặc biệt: `SidebarItem` thông minh hỗ trợ thu gọn (collapsed), tooltip trên hover, submenu lồng nhau, nhận diện Link/Button tự động.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Sparkles, ChevronDown, PanelLeftClose, PanelLeft, Menu, X } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { Button } from '@/components/base/Button';
import { motion, AnimatePresence } from 'framer-motion';

export interface SubItem {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
}

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  variant?: 'default' | 'danger';
  isCollapsed?: boolean;
  subItems?: SubItem[];
}

export const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href, 
  onClick, 
  active, 
  variant = 'default', 
  isCollapsed = false,
  subItems 
}: SidebarItemProps) => {
  const hasSubItems = subItems && subItems.length > 0;
  const storageKey = `sidebar-menu-open-${label}`;
  
  const [isOpen, setIsOpen] = React.useState(false);

  // Khôi phục trạng thái đóng/mở từ localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined' && hasSubItems) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setIsOpen(saved === 'true');
      } else {
        // Mặc định là đóng khi mở trang
        setIsOpen(false);
      }
    }
  }, [hasSubItems, storageKey]);

  const baseStyles = `w-full flex items-center justify-between rounded-2xl font-bold transition-all text-small cursor-pointer group relative ${
    isCollapsed ? 'px-4 py-4 justify-center' : 'px-6 py-4 gap-4'
  }`;
  
  const activeStyles = "bg-primary text-white shadow-md shadow-primary/20 dark:bg-primary dark:text-white";
  const inactiveStyles = "text-gray-400 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-600 dark:hover:text-slate-200";
  const dangerStyles = "text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500";

  const handleToggleOpen = (e: React.MouseEvent) => {
    if (hasSubItems && !isCollapsed) {
      e.preventDefault();
      e.stopPropagation();
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, String(nextOpen));
      }
    } else if (onClick) {
      onClick();
    }
  };

  const itemContent = (
    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} w-full`}>
      <Icon size={20} className={active ? "text-white" : ""} />
      {!isCollapsed && <span className="truncate flex-1 text-left">{label}</span>}
      {hasSubItems && !isCollapsed && (
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      )}
      {/* Tooltip khi bị collapsed */}
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-[999] font-medium">
          {label}
        </div>
      )}
    </div>
  );

  // Submenu nổi khi hover ở chế độ collapsed
  const collapsedSubMenu = isCollapsed && hasSubItems && (
    <div className="absolute left-full top-0 ml-4 py-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto min-w-[200px] z-[999] flex flex-col space-y-1 p-2">
      <div className="px-3 py-1.5 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 border-b border-gray-50 dark:border-slate-800 mb-1">
        {label}
      </div>
      {subItems.map((sub, idx) => (
        sub.href ? (
          <Link
            key={idx}
            href={sub.href}
            className={`px-3 py-2 rounded-xl text-xs font-bold text-left block transition-colors ${
              sub.active
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {sub.label}
          </Link>
        ) : (
          <button
            key={idx}
            onClick={sub.onClick}
            className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left block transition-colors ${
              sub.active
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {sub.label}
          </button>
        )
      ))}
    </div>
  );

  const mainItem = href && !hasSubItems ? (
    <Link href={href} className={`${baseStyles} ${active ? activeStyles : (variant === 'danger' ? dangerStyles : inactiveStyles)}`}>
      {itemContent}
    </Link>
  ) : (
    <Button 
      onClick={handleToggleOpen} 
      variant="none" 
      size="none" 
      className={`${baseStyles} ${active ? activeStyles : (variant === 'danger' ? dangerStyles : inactiveStyles)}`}
    >
      {itemContent}
      {collapsedSubMenu}
    </Button>
  );

  return (
    <div className="w-full flex flex-col">
      {mainItem}
      
      {/* Menu con lồng bên trong khi mở rộng */}
      {hasSubItems && !isCollapsed && isOpen && (
        <div className="flex flex-col ml-8 mt-2 space-y-1.5 pl-4 border-l border-gray-100 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
          {subItems.map((sub, idx) => {
            const subStyles = `w-full text-left py-2 px-4 rounded-xl font-bold transition-all text-xs flex items-center gap-2 cursor-pointer ${
              sub.active 
                ? 'text-primary bg-primary/[0.04] dark:bg-primary/[0.08]' 
                : 'text-gray-400 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-600 dark:hover:text-slate-200'
            }`;
            const SubIcon = sub.icon;
            
            const subContent = (
              <>
                {SubIcon && <SubIcon size={14} />}
                <span>{sub.label}</span>
              </>
            );

            if (sub.href) {
              return (
                <Link key={idx} href={sub.href} className={subStyles}>
                  {subContent}
                </Link>
              );
            }

            return (
              <Button key={idx} onClick={sub.onClick} variant="none" size="none" className={subStyles}>
                {subContent}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const useSidebarCollapse = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(newVal));
    }
  };

  return { isCollapsed, toggleCollapse };
};

interface SidebarProps {
  brandIcon?: LucideIcon;
  brandLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBrand?: boolean;
  className?: string;
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
}

export const Sidebar = ({ 
  brandIcon: BrandIcon = Sparkles, 
  brandLabel = LABELS.COMMON.BRAND_NAME, 
  children, 
  footer,
  showBrand = true,
  className = '',
  isCollapsed = false,
  onCollapseToggle
}: SidebarProps) => {
  const ToggleIcon = isCollapsed ? PanelLeft : PanelLeftClose;
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <>
      {/* Nút Hamburger cho Mobile - Đặt đè lên Navbar */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-5 z-[51] p-2 bg-gray-50/50 hover:bg-gray-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 border border-gray-100/50 dark:border-slate-800/50 text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-slate-200 rounded-xl md:hidden transition-all shadow-sm focus:outline-none flex items-center justify-center cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990] md:hidden"
            />
            {/* Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-6 z-[9991] flex flex-col md:hidden shadow-2xl"
            >
              {/* Top brand header & Close button */}
              <div className="flex items-center justify-between mb-8 border-b border-gray-50 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white shadow-md">
                    <BrandIcon size={18} />
                  </div>
                  <span className="text-lg font-bold gradient-text tracking-tight">{brandLabel}</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation inside Drawer */}
              <nav className="space-y-3 flex-1 overflow-y-auto pr-1">
                {React.Children.map(children, child => {
                  if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { 
                      isCollapsed: false,
                      onClick: () => {
                        const origOnClick = (child.props as any).onClick;
                        if (origOnClick) origOnClick();
                        setIsMobileOpen(false);
                      }
                    });
                  }
                  return child;
                })}
              </nav>

              {/* Footer inside Drawer */}
              {footer && (
                <div className="mt-auto pt-6 border-t border-gray-50 dark:border-slate-800/50 w-full space-y-2">
                  {React.Children.map(footer, child => {
                    if (React.isValidElement(child)) {
                      return React.cloneElement(child as React.ReactElement<any>, {
                        isCollapsed: false,
                        onClick: () => {
                          const origOnClick = (child.props as any).onClick;
                          if (origOnClick) origOnClick();
                          setIsMobileOpen(false);
                        }
                      });
                    }
                    return child;
                  })}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className={`bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 hidden md:flex flex-col fixed h-full z-20 transition-all duration-300 ${
        isCollapsed ? 'w-20 p-4 items-center' : 'w-80 p-8'
      } ${className}`}>
        {showBrand && (
          <div className={`flex items-center mb-12 px-2 w-full ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                <BrandIcon size={24} />
              </div>
              {!isCollapsed && (
                <span className="text-2xl font-bold gradient-text tracking-tight">{brandLabel}</span>
              )}
            </div>
          </div>
        )}

        {onCollapseToggle && (
          <button 
            onClick={onCollapseToggle} 
            className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all shadow-md z-30 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label={isCollapsed ? LABELS.RESTAURANT.SIDEBAR.EXPAND : LABELS.RESTAURANT.SIDEBAR.COLLAPSE}
          >
            <ToggleIcon size={12} />
          </button>
        )}

        <nav className={`space-y-3 flex-1 overflow-y-auto custom-scrollbar w-full ${isCollapsed ? 'px-0' : 'pr-2'}`}>
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { isCollapsed });
            }
            return child;
          })}
        </nav>

        {footer && (
          <div className={`mt-auto pt-6 border-t border-gray-50 dark:border-slate-800/50 w-full ${isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}`}>
            {isCollapsed ? (
              <div className="flex flex-col gap-2 items-center">
                {React.Children.map(footer, child => {
                  if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { isCollapsed, size: 'none', className: 'p-3 rounded-xl' });
                  }
                  return child;
                })}
              </div>
            ) : (
              footer
            )}
          </div>
        )}
      </aside>
    </>
  );
};
