# Engineering Tasks - Sprint 8

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 8.

## 1. Advanced Security (Bảo mật nâng cao)

### [Backend]
- [x] Task 1.1: Tích hợp Helmet middleware cấu hình an toàn HTTP Headers.
- [x] Task 1.2: Cấu hình và thiết lập thư viện bảo mật CSRF (ví dụ: csurf hoặc giải pháp custom CSRF với Double Submit Cookie).
- [x] Task 1.3: Cấu hình ValidationPipe kết hợp class-sanitizer để lọc dữ liệu đầu vào chống XSS.

> Ghi chú kiểm tra code: `ValidationPipe` toàn cục đã được cấu hình với `whitelist`, `transform`, `forbidNonWhitelisted` trong `backend/src/main.ts`; phần `class-sanitizer`/sanitization chống XSS chuyên biệt đã được bổ sung hoàn chỉnh bằng `XssSanitizerInterceptor` toàn cục.

---

## 2. Advanced AI & Engagement (Gợi ý & Tương tác nâng cao)

### [Backend]
- [x] Task 2.1: API Refresh AI suggestions: Thêm cơ chế offset/random seed trong Vector Database.
- [x] Task 2.2: Tích hợp cấu hình SEO động (Dynamic OG tags) cho trang Chi tiết Nhà hàng ở server-side rendering.

