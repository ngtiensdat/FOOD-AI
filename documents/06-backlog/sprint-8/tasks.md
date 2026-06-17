# Engineering Tasks - Sprint 8

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 8.

## 1. Advanced Security (Bảo mật nâng cao)

### [Backend]
- [x] Task 1.1: Tích hợp Helmet middleware cấu hình an toàn HTTP Headers.
- [ ] Task 1.2: Cấu hình và thiết lập thư viện bảo mật CSRF (ví dụ: csurf hoặc giải pháp custom CSRF với Double Submit Cookie).
- [ ] Task 1.3: Cấu hình ValidationPipe kết hợp class-sanitizer để lọc dữ liệu đầu vào chống XSS.

> Ghi chú kiểm tra code: `ValidationPipe` toàn cục đã được cấu hình với `whitelist`, `transform`, `forbidNonWhitelisted` trong `backend/src/main.ts`; phần `class-sanitizer`/sanitization chống XSS chuyên biệt vẫn chưa có bằng chứng hoàn thành.

---

## 2. Advanced AI & Engagement (Gợi ý & Tương tác nâng cao)

### [Backend]
- [ ] Task 2.1: API Refresh AI suggestions: Thêm cơ chế offset/random seed trong Vector Database.
- [ ] Task 2.2: Tích hợp cấu hình SEO động (Dynamic OG tags) cho Món ăn và Bài viết tại server-side rendering (nếu cần).

### [Frontend]
- [ ] Task 2.3: UI nút "Làm mới gợi ý" và kết nối API tải lại Suggestions ở trang chủ.
- [ ] Task 2.4: Component nút bấm Chia sẻ (Share menu dropdown) với các tùy chọn Facebook, Zalo, Copy Link.
- [ ] Task 2.5: Tích hợp Web Share API cho thiết bị Mobile.
