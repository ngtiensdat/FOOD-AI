# Engineering Tasks - Sprint 1

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 1.

## 1. Authentication (Xác thực)

### [Backend]
- [x] Task 1.1: Thiết lập NestJS project và Prisma ORM.
- [x] Task 1.2: API Đăng ký tài khoản (JWT + Password Hashing).
- [x] Task 1.3: API Đăng nhập và quản lý Refresh Token.
- [ ] Task 1.4: API Quên mật khẩu & Gửi mã Reset qua Email.
- [ ] Task 1.5: Tích hợp Nodemailer để xác thực tài khoản qua Email.

### [Frontend]
- [x] Task 1.6: UI Trang Login và Register.
- [x] Task 1.7: Tích hợp Zustand (authStore) để quản lý trạng thái đăng nhập.
- [x] Task 1.8: Logic lưu JWT vào HttpOnly Cookies.

---

## 2. Security & Foundation

### [Backend]
- [x] Task 2.1: Cấu hình CustomThrottlerGuard (Rate Limiting) chống Brute Force.
- [x] Task 2.2: Middleware xử lý lỗi tập trung và chuẩn hóa response.
- [x] Task 2.3: Phân quyền vai trò người dùng (Roles Guard).
- [ ] Task 2.4: Cơ chế cho phép người dùng yêu cầu xóa tài khoản.

### [Frontend]
- [x] Task 2.5: Xây dựng Main Layout (Navbar, Footer, Sidebar).
- [x] Task 2.6: Cấu hình API Client (Axios) tự động đính kèm Token.
