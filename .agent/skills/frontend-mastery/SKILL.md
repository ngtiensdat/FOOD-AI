# Skill: Frontend Mastery (Next.js & Premium UI)

## 1. Overview
Kỹ năng này giúp Agent trở thành chuyên gia xây dựng giao diện Next.js hiện đại, tập trung vào hiệu năng, SEO và trải nghiệm người dùng "Wow" (Premium UX).

## 2. Technical Stack
- **Framework:** Next.js 14+ (App Router).
- **Styling:** Tailwind CSS.
- **Animation:** Framer Motion.
- **State:** Zustand / React Context.

## 3. Core Implementation Patterns

### 3.1. Server vs Client Components
- Luôn ưu tiên **Server Components** cho các thành phần tĩnh để tối ưu SEO và tốc độ load.
- Chỉ sử dụng `'use client'` cho các thành phần cần tương tác (Form, Modal, Slider).

### 3.2. Premium UI Secrets
- **Glassmorphism:** Sử dụng `backdrop-blur-md` kết hợp với màu trắng/đen có độ trong suốt (opacity).
- **Smooth Transitions:** Luôn bao bọc các thay đổi trạng thái bằng `AnimatePresence` của Framer Motion.
- **Micro-animations:** Thêm hiệu ứng `whileHover={{ scale: 1.02 }}` cho các thẻ món ăn.

### 3.3. Performance Optimization
- **Image Component:** Luôn dùng `next/image` với `priority` cho các ảnh Hero.
- **Dynamic Imports:** Sử dụng `dynamic()` cho các Modal hoặc Component nặng để giảm Bundle Size.

## 4. Code Snippet: Premium Card Pattern
```tsx
import { motion } from 'framer-motion';

export const PremiumCard = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-3xl border border-white/20 shadow-xl"
  >
    {children}
  </motion.div>
);
```

## Checklist
- [ ] Component đã được tách biệt Server/Client đúng chỗ chưa?
- [ ] Các hiệu ứng animation có bị giật (jitter) không?
- [ ] Ảnh đã được tối ưu bằng `next/image` chưa?
- [ ] Giao diện có hiển thị tốt trên Mobile không?
