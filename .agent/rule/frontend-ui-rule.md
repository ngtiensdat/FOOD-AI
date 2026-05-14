# Rule: Frontend UI & UX Standard (Ultimate Version)

## 1. Anti-Redundancy (Tiêu diệt trùng lặp)
- **Base Components:** Mọi UI xuất hiện > 2 lần PHẢI nằm trong `src/components/base/`.
- **Global Layouts:** Sử dụng App Router Layout để quản lý Header/Footer/Sidebars. CẤM copy-paste cấu trúc khung vào từng trang.

## 2. Design System Tokens (Hệ thống biến)
- **Magic Values:** CẤM dùng `rounded-[...]`, `bg-[#...]`, `text-[...]`. Tất cả phải khai báo trong `tailwind.config.ts`.
- **Typography:** Chỉ sử dụng các class: `text-h1`, `text-h2`, `text-body`, `text-small`.

## 3. UI State Management (Quản lý trạng thái)
- **Skeleton First:** CẤM dùng Loading Spinner cho khối dữ liệu. Hãy dùng Skeleton Screen.
- **Feedback System:** Sử dụng Global Toast cho các thông báo Thành công/Lỗi. Không tự code UI thông báo trong từng Component.

## 4. Accessibility & SEO (Chuẩn SEO & Tiếp cận)
- **Semantic HTML:** Luôn dùng `<main>`, `<section>`, `<article>`, `<aside>`. Chỉ có 1 thẻ `<h1>` duy nhất.
- **Next/Image:** Luôn dùng thẻ `Image` từ `next/image` kèm `alt` text để tối ưu hiệu năng.
- **Aria-Labels:** Mọi nút bấm icon-only phải có `aria-label` cho trình đọc màn hình.

## 5. Interactions (Tương tác)
- **Visual Feedback:** Mọi nút bấm/link phải có trạng thái Hover, Active, Disabled rõ ràng.
- **Motion Presets:** Chỉ dùng các `variants` đã định nghĩa sẵn của `framer-motion`.

## Checklist
- [ ] Trang này có đang lặp lại Header/Footer không?
- [ ] Đã dùng Global Toast thay vì tự code thông báo chưa?
- [ ] Các icon-only button đã có `aria-label` chưa?
- [ ] Đã dùng `next/image` kèm `alt` text chưa?

---

### ❌ Cấm (Don't)
```tsx
// 1. Lặp lại CSS & Sai ngữ nghĩa
<div className="p-4 bg-white shadow-lg rounded-xl">
  <div className="text-[20px] font-bold text-[#ff6b00]">Tiêu đề</div>
  <button className="px-6 py-3 bg-orange-500 text-white rounded-2xl shadow-lg hover:bg-orange-600 transition-all">
    Click Me
  </button>
</div>

// 2. Dùng Magic Values
<div className="w-full h-[350px] bg-[#1a1a1a] rounded-[20px]"></div>
```

### ✅ Nên (Should)
```tsx
// 1. Dùng Semantic HTML + Design Tokens + Base Component
<article className="card-glass p-layout">
  <h2 className="text-h2 text-primary">Tiêu đề</h2>
  <Button variant="primary" aria-label="Gửi thông tin">
    Click Me
  </Button>
</article>

// 2. Dùng Tailwind Config
<div className="w-full h-hero bg-dark-card rounded-card">
  {/* Content */}
</div>
```
