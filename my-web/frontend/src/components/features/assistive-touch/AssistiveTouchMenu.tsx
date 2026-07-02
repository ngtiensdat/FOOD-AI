// Mục đích file này để làm gì: Thành phần giao diện điều hướng nhanh thông minh AssistiveTouch mô phỏng phong cách iOS.
// Các file khác hay file này có ý nghĩa như nào: Được tích hợp toàn cục tại RootLayout, cung cấp lối tắt mở nhanh trang chủ, khám phá, trợ lý AI, diễn đàn, dashboard.
// Các chức năng đặc biệt: Kéo thả tự do, tự hút cạnh màn hình, tự chuyển góc hiển thị, bong bóng thoại hướng SVG, tích hợp chibi mascot nháy mắt.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Component-based Architecture, Declarative Animation (Framer Motion), Custom Hook (useAssistiveTouch).
// Các biến, hàm đặc biệt trong file: AssistiveTouchMenu (React Component).
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { SafeImage } from '@/components/base/SafeImage';
import { useAssistiveTouch } from '@/hooks/useAssistiveTouch';
import { Button } from '@/components/base/Button';
import { AiChatWindow } from '@/components/features/ai/AiChatWindow';
import { FoodDetailModal } from '@/components/features/food/FoodDetailModal';
import { LABELS } from '@/constants/labels';

export const AssistiveTouchMenu = () => {
  const {
    isOpen,
    setIsOpen,
    isAiChatOpen,
    setIsAiChatOpen,
    selectedFood,
    setSelectedFood,
    parentRef,
    constraintsRef,
    controls,
    menuItems,
    toggleMenu,
    handleDragStart,
    handleDragEnd,
    quadrant,
  } = useAssistiveTouch();

  // Tạo mảng 6 phần tử gồm 5 tính năng chính và 1 nút đóng (X)
  const allItems = [
    ...menuItems,
    {
      id: 'close',
      label: LABELS.COMMON.CLOSE,
      icon: <X size={20} />,
      action: () => setIsOpen(false),
    },
  ];

  return (
    <>
      {/* 1. Backdrop mờ nhẹ khi mở menu để tăng tính tập trung */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 dark:bg-black/35 z-[990] transition-colors"
          />
        )}
      </AnimatePresence>

      {/* 2. Giới hạn vùng kéo thả cách lề 16px (inset-4) */}
      <div ref={constraintsRef} className="fixed inset-4 pointer-events-none z-[995]" />

      {/* 3. Vùng chứa bong bóng và ô vuông tính năng */}
      <motion.div
        ref={parentRef}
        drag={!isOpen}
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="fixed z-[995] w-20 h-20 pointer-events-auto"
        style={{
          right: 24,
          bottom: 96,
        }}
      >
        {/* Bong bóng AssistiveTouch chính (Luôn hiển thị và đóng vai trò neo giữ) */}
        <Button
          type="button"
          onClick={toggleMenu}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          variant="none"
          size="none"
          className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center cursor-pointer bg-white/95 dark:bg-slate-950/95 border-2 ${
            isOpen 
              ? 'border-primary scale-95 shadow-primary/25' 
              : 'border-orange-300 dark:border-slate-600 hover:scale-105 hover:border-primary dark:hover:border-primary active:scale-95'
          } backdrop-blur-md transition-all duration-250 select-none z-30 relative group/main`}
          aria-label={isOpen ? "Đóng menu tiện ích" : "Mở menu tiện ích"}
        >
          <div className="relative w-18 h-18">
            <SafeImage
              src="/balloon.png"
              alt="Utility Bubble"
              fill
              sizes="72px"
              priority
              className={`object-contain pointer-events-none select-none transition-transform ${
                isOpen ? 'scale-90 opacity-80' : 'group-hover/main:scale-110'
              }`}
            />
          </div>
        </Button>

        {/* Ô vuông tính năng bo góc mở rộng (Hộp hội thoại chui ra từ bong bóng) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.1, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              style={{
                transformOrigin: `${quadrant.isLeft ? 'left' : 'right'} ${quadrant.isTop ? '40px' : 'calc(100% - 40px)'}`
              }}
              className={`absolute w-[290px] h-[210px] rounded-[32px] bg-gradient-to-br from-primary-light/95 to-primary/95 border border-white/20 shadow-2xl shadow-primary/30 backdrop-blur-md p-4 z-20 flex flex-col justify-center ${
                quadrant.isLeft ? 'left-[92px]' : 'right-[92px]'
              } ${
                quadrant.isTop ? 'top-2' : 'bottom-2'
              }`}
            >
              {/* Chibi Linh Vật nháy mắt xuất hiện phía trên/dưới hộp điều khiển */}
              <motion.div
                initial={{ y: quadrant.isTop ? -15 : 15, opacity: 0, scale: 0.7 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: quadrant.isTop ? -15 : 15, opacity: 0, scale: 0.7 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 350, damping: 22 }}
                className={`absolute w-20 h-20 z-30 pointer-events-none select-none ${
                  quadrant.isTop ? '-bottom-[72px]' : '-top-[72px]'
                } ${
                  quadrant.isLeft ? 'right-6' : 'left-6'
                }`}
              >
                <div className="relative w-full h-full">
                  <SafeImage
                    src="/chibi linh vật/nháy mắt.png"
                    alt="Chibi Mascot"
                    fill
                    sizes="80px"
                    className="object-contain filter drop-shadow-md"
                  />
                </div>
              </motion.div>

              {/* Mũi nhọn hội thoại hướng về bong bóng sử dụng SVG không bị đè viền hoặc lộ khía góc */}
              {quadrant.isLeft ? (
                <svg
                  width="9"
                  height="18"
                  viewBox="0 0 9 18"
                  className={`absolute left-[-8px] ${quadrant.isTop ? 'top-[31px]' : 'bottom-[31px]'}`}
                >
                  <path
                    d="M 8 1 L 1 9 L 8 17 Z"
                    fill="var(--primary-light)"
                  />
                  <path
                    d="M 8 1 L 1 9 L 8 17"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                  />
                </svg>
              ) : (
                <svg
                  width="9"
                  height="18"
                  viewBox="0 0 9 18"
                  className={`absolute right-[-8px] ${quadrant.isTop ? 'top-[31px]' : 'bottom-[31px]'}`}
                >
                  <path
                    d="M 0 1 L 7 9 L 0 17 Z"
                    fill="var(--primary)"
                  />
                  <path
                    d="M 0 1 L 7 9 L 0 17"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                  />
                </svg>
              )}

              <div className="grid grid-cols-3 gap-2 w-full h-full select-none">
                {allItems.map((item) => {
                  const itemWithHref = item as { href?: string; action?: () => void; id: string; label: string; icon: React.ReactNode };
                  const content = (
                    <>
                      <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/90 group-hover:scale-105 group-hover:bg-white/20 group-hover:border-white/30 transition-all duration-200">
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-bold text-center text-white/80 group-hover:text-white transition-colors truncate max-w-full px-1">
                        {item.label}
                      </span>
                    </>
                  );

                  return itemWithHref.href ? (
                    <Link
                      key={item.id}
                      href={itemWithHref.href}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-2xl transition-all duration-150 group active:scale-90 cursor-pointer"
                      aria-label={item.label}
                    >
                      {content}
                    </Link>
                  ) : (
                    <Button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        if (itemWithHref.action) itemWithHref.action();
                      }}
                      variant="none"
                      size="none"
                      className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-2xl transition-all duration-150 group active:scale-90 cursor-pointer bg-transparent border-none outline-none"
                      aria-label={item.label}
                    >
                      {content}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 4. Modal Chat AI Toàn cục */}
      <AnimatePresence>
        {isAiChatOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiChatOpen(false)}
              className="absolute inset-0 bg-transparent"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl shadow-2xl rounded-3xl overflow-hidden z-10"
            >
              <AiChatWindow
                onResetChat={() => setIsAiChatOpen(false)}
                onViewDetail={(food) => setSelectedFood(food)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Modal Chi tiết Món ăn Toàn cục */}
      <AnimatePresence>
        {selectedFood && (
          <div className="z-[10000] relative">
            <FoodDetailModal 
              food={selectedFood} 
              onClose={() => setSelectedFood(null)} 
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
