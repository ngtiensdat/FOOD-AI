// Mục đích file này để làm gì: Custom hook chịu trách nhiệm xử lý logic nghiệp vụ cho bong bóng AssistiveTouch.
// Các file khác hay file này có ý nghĩa như nào: Tách biệt logic kéo thả, snap góc, resize màn hình và quản lý phân quyền menu khỏi component hiển thị AssistiveTouchMenu.tsx.
// Các chức năng đặc biệt: Nhận biết vai trò người dùng (Admin, Restaurant, User), tự động tính toán 4 góc hiển thị màn hình, tự bắt sự kiện resize.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Separation of Concerns (SoC), Single Responsibility Principle (SRP).
// Các biến, hàm đặc biệt trong file: useAssistiveTouch (custom hook), handleDragEnd (xử lý hít cạnh), toggleMenu (mở rộng/thu nhỏ menu).
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAnimation, PanInfo } from 'framer-motion';
import { 
  Home, 
  Compass, 
  Sparkles, 
  MessageSquare, 
  User, 
  Shield, 
  Store, 
  LogIn,
  Ticket,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LABELS } from '@/constants/labels';
import { FoodDetailData } from '@/components/features/food/FoodDetailModal';
import React from 'react';

export const useAssistiveTouch = () => {
  const { user, isAuthenticated, isAdmin, isRestaurant } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodDetailData | null>(null);
  const [quadrant, setQuadrant] = useState({ isLeft: true, isTop: false });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customItemIds, setCustomItemIds] = useState<string[]>(['home', 'explore', 'ai', 'forum', 'profile']);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isDragging = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('assistive_touch_items');
      if (saved) {
        try {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids) && ids.length > 0) {
            setCustomItemIds(ids);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const saveCustomItems = (ids: string[]) => {
    setCustomItemIds(ids);
    localStorage.setItem('assistive_touch_items', JSON.stringify(ids));
  };

  // 1. Xác định vai trò người dùng để tạo tùy chọn động cho nút thứ 5
  const getProfileItem = () => {
    if (!isAuthenticated || !user) {
      return {
        label: LABELS.AUTH?.LOGIN || 'Đăng nhập',
        icon: React.createElement(LogIn, { size: 20 }),
        href: '/login',
      };
    }

    if (isAdmin) {
      return {
        label: LABELS.NAV?.ADMIN_PANEL || 'Quản trị',
        icon: React.createElement(Shield, { size: 20 }),
        href: '/admin',
      };
    }

    if (isRestaurant) {
      return {
        label: LABELS.NAV?.RESTAURANT_PANEL || 'Cửa hàng',
        icon: React.createElement(Store, { size: 20 }),
        href: '/restaurant-admin',
      };
    }

    return {
      label: LABELS.NAV?.DASHBOARD || 'Cá nhân',
      icon: React.createElement(User, { size: 20 }),
      href: '/dashboard',
    };
  };

  const profileItem = getProfileItem();

  const allPossibleItems = [
    { id: 'home', label: LABELS.NAV?.HOME || 'Trang chủ', icon: React.createElement(Home, { size: 20 }), href: '/' },
    { id: 'explore', label: LABELS.NAV?.EXPLORE || 'Khám phá', icon: React.createElement(Compass, { size: 20 }), href: '/explore' },
    { id: 'ai', label: LABELS.NAV?.AI_CHAT || 'Trợ lý AI', icon: React.createElement(Sparkles, { size: 20 }), action: () => setIsAiChatOpen(true) },
    { id: 'forum', label: LABELS.NAV?.FORUM || 'Diễn đàn', icon: React.createElement(MessageSquare, { size: 20 }), href: '/forum' },
    { id: 'vouchers', label: 'Ví Voucher', icon: React.createElement(Ticket, { size: 20 }), href: '/vouchers' },
    { id: 'pos', label: 'Hệ thống POS', icon: React.createElement(Store, { size: 20 }), href: '/pos' },
    { id: 'profile', ...profileItem }
  ];

  const menuItems = customItemIds
    .map(id => allPossibleItems.find(item => item.id === id))
    .filter(Boolean) as typeof allPossibleItems;

  // 2. Xử lý sự kiện Drag & Snap
  const handleDragStart = () => {
    isDragging.current = true;
    setIsOpen(false);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!parentRef.current) return;
    const rect = parentRef.current.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;
    const buttonWidth = rect.width || 80;
    const buttonHeight = rect.height || 80;

    // Xác định lề trái hay phải gần hơn
    const leftDist = rect.left;
    const rightDist = W - rect.right;
    const isLeft = leftDist < rightDist;

    // Tính toán targetX để hít về lề gần nhất (cách lề 16px)
    const targetLeft = isLeft ? 16 : W - 16 - buttonWidth;
    const targetX = targetLeft - (W - 24 - buttonWidth);

    // Giới hạn trục Y trong khoảng an toàn
    const boundedTop = Math.max(16, Math.min(H - 16 - buttonHeight, rect.top));
    const targetY = boundedTop - (H - 96 - buttonHeight);

    controls.start({
      x: targetX,
      y: targetY,
      transition: { type: 'spring', stiffness: 450, damping: 28 }
    });

    setTimeout(() => {
      isDragging.current = false;
    }, 100);
  };

  // Tự động hít cạnh khi resize màn hình
  useEffect(() => {
    const handleResize = () => {
      if (!parentRef.current) return;
      const rect = parentRef.current.getBoundingClientRect();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const buttonWidth = rect.width || 80;
      const buttonHeight = rect.height || 80;

      const isLeft = rect.left + buttonWidth / 2 < W / 2;
      const targetLeft = isLeft ? 16 : W - 16 - buttonWidth;
      const targetX = targetLeft - (W - 24 - buttonWidth);
      
      const boundedTop = Math.max(16, Math.min(H - 16 - buttonHeight, rect.top));
      const targetY = boundedTop - (H - 96 - buttonHeight);

      controls.start({
        x: targetX,
        y: targetY,
        transition: { type: 'tween', duration: 0.1 }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [controls]);

  // 3. Tính toán góc bung động
  const toggleMenu = () => {
    if (isDragging.current) return;

    if (!isOpen && parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      setQuadrant({
        isLeft: cx < W / 2,
        isTop: cy < H / 2
      });
    }

    setIsOpen(!isOpen);
  };

  // Lấy các góc bung cho 5 nút con
  const getAngles = () => {
    const { isLeft, isTop } = quadrant;
    if (isLeft && isTop) {
      return [-15, 15, 45, 75, 105];
    } else if (!isLeft && isTop) {
      return [75, 105, 135, 165, 195];
    } else if (isLeft && !isTop) {
      return [255, 285, 315, 345, 375];
    } else {
      return [165, 195, 225, 255, 285];
    }
  };

  const angles = getAngles();
  const radius = 88; // Bán kính bung

  return {
    isOpen,
    setIsOpen,
    isAiChatOpen,
    setIsAiChatOpen,
    selectedFood,
    setSelectedFood,
    parentRef,
    constraintsRef,
    controls,
    isDragging,
    menuItems,
    toggleMenu,
    handleDragStart,
    handleDragEnd,
    angles,
    radius,
    quadrant,
    isCustomizing,
    setIsCustomizing,
    customItemIds,
    allPossibleItems,
    saveCustomItems,
  };
};
