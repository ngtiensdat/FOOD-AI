# Kiến thức kỹ thuật dự án FOOD AI

Tài liệu này tổng hợp các kiến thức nền tảng và chuyên sâu cần thiết để phát triển và duy trì dự án.

## 1. Nền tảng lập trình (Basic)
- **Hướng đối tượng (OOP):** Class, Object, Encapsulation, Polymorphism, Inheritance, Abstraction.
- **SOLID Principles:** 5 nguyên tắc thiết kế phần mềm bền vững.
- **Dependency Injection (DI):** Cơ chế quan trọng trong NestJS.
- **Cấu trúc dữ liệu & Giải thuật:** Array methods, Big O, Sorting, Searching.

## 2. Frontend (Next.js & React)
- **HTML & SEO:** Semantic HTML, Metadata, Open Graph.
- **CSS & UI:** Flexbox, Grid, Tailwind CSS, Responsive Design.
- **Javascript (ES6+):** Closures, Hoisting, Promises, Async/Await, Destructuring.
- **TypeScript:** Interface vs Type, Generics, Utility Types.
- **React & Next.js:** Hooks (useState, useEffect, useMemo), Server Components, SSR/SSG/ISR, App Router.

## 3. Backend (NestJS & Node.js)
- **Kiến trúc NestJS:** Modules, Controllers, Services, Providers.
- **Xử lý request:** Middleware, Interceptors, Guards, Pipes.
- **Dữ liệu & Xác thực:** DTOs, Validation, JWT, Passport.
- **Node.js:** Event Loop, Asynchronous I/O.
- **Real-time:** WebSockets (Socket.io).

## 4. Cơ sở dữ liệu (PostgreSQL & Prisma)
- **RDBMS:** Quan hệ, Khóa chính/Khóa ngoại, Joins.
- **Tối ưu:** Indexing, ACID Transactions, N+1 problem.
- **Prisma ORM:** Schema management, Migrations, Seed data.
- **Vector Database:** `pgvector` phục vụ tìm kiếm AI.

## 5. Quy trình & Bảo mật
- **Git:** Git Flow (Branches, Merging, Rebase).
- **Bảo mật:** 
  - Chống SQL Injection (Prisma tự động hỗ trợ).
  - Phòng tránh XSS, CSRF.
  - Mã hóa mật khẩu với Bcrypt & Salt.
  - Rate Limiting.
- **DevOps:** Docker, Docker Compose, CI/CD basic.
