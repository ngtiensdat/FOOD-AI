# Engineering Tasks - Sprint 1

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 1.

## 1. Authentication (Xác thực)

### [Backend]
- [x] Task 1.1: Thiết lập NestJS project và Prisma ORM.
- [x] Task 1.2: API Đăng ký tài khoản (JWT + Password Hashing).
- [x] Task 1.3: API Đăng nhập và quản lý Refresh Token.
- [x] Task 1.4: API Quên mật khẩu & Gửi mã Reset qua Email.
- [x] Task 1.5: Tích hợp Nodemailer để xác thực tài khoản qua Email.

### [Frontend]
- [x] Task 1.6: UI Trang Login và Register.
- [x] Task 1.7: Tích hợp Zustand (authStore) để quản lý trạng thái đăng nhập.
- [x] Task 1.8: Logic lưu JWT vào HttpOnly Cookies.
- [x] Task 1.9: UI Trang Quên mật khẩu & Đặt lại mật khẩu.
- [x] Task 1.10: UI Trang thông báo Xác thực Email và form nhập mã OTP.

---

## 2. Security & Foundation

### [Backend]
- [x] Task 2.1: Cấu hình CustomThrottlerGuard (Rate Limiting) chống Brute Force.
- [x] Task 2.2: Middleware xử lý lỗi tập trung và chuẩn hóa response.
- [x] Task 2.3: Phân quyền vai trò người dùng (Roles Guard).
- [x] Task 2.4: Cơ chế cho phép người dùng yêu cầu xóa tài khoản.

### [Frontend]
- [x] Task 2.5: Xây dựng Main Layout (Navbar, Footer, Sidebar).
- [x] Task 2.6: Cấu hình API Client (Axios) tự động đính kèm Token.
- [x] Task 2.7: UI nút Xóa tài khoản trong Cài đặt Profile & Modal nhập mật khẩu xác nhận.
