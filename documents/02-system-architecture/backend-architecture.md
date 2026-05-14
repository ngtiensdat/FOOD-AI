# Kiến trúc Backend - FOOD AI

Tài liệu này mô tả cấu trúc và logic xử lý phía Server.

## 1. Công nghệ sử dụng
- **Framework:** NestJS (Node.js).
- **ORM:** Prisma Client.
- **Database:** PostgreSQL.
- **Xác thực:** JWT (JSON Web Token) & Passport.
- **Gửi mail:** `@nestjs-modules/mailer` (Mailtrap/Gmail).

## 2. Cấu trúc Module-based
Hệ thống được chia thành các module nghiệp vụ chính:
- **Auth Module:** Xử lý đăng ký, đăng nhập và phân quyền.
- **Food Module:** Quản lý món ăn, thực đơn và nhà hàng.
- **AI Module:** Cầu nối với OpenAI API và xử lý Vector Search.
- **Mail Module:** Tự động gửi email xác thực và thông báo.

## 3. Quy trình xử lý Request
1. **Controller:** Nhận request, kiểm tra DTO (Validation).
2. **Guard:** Kiểm tra quyền truy cập (JWT Strategy).
3. **Service:** Thực thi logic nghiệp vụ và tương tác với Database qua Prisma.
4. **Prisma:** Truy vấn PostgreSQL.
5. **Interceptor/Filter:** Định dạng response hoặc xử lý lỗi tập trung.
