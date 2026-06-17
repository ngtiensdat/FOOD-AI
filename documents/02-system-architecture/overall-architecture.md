# Kiến trúc hệ thống FOOD AI

Tài liệu này cung cấp cái nhìn tổng quan về công nghệ, cấu trúc thư mục và luồng hoạt động của hệ thống.

## I. Tổng quan công nghệ (Tech Stack)

### 1. Frontend
- **Framework:** Next.js 16+ (App Router).
- **Ngôn ngữ:** TypeScript.
- **Styling:** Tailwind CSS v4.
- **Animation:** Framer Motion.
- **Icons:** Lucide React.

### 2. Backend
- **Framework:** NestJS.
- **ORM:** Prisma.
- **Database:** PostgreSQL + `pgvector`.
- **AI Engine:** OpenAI API (GPT-4 / Text Embedding Ada-002).
- **Auth:** JWT & Bcrypt.

---

## II. Cấu trúc mã nguồn (Source Architecture)

Dự án được tổ chức theo mô hình **Clean Architecture** & **Feature-Driven Design**.

### 1. Frontend (`my-web/frontend/src`)
- `app/`: Routing và các trang (Home, Login, Admin, Profile).
- `components/`:
  - `base/`: UI components cơ bản (Button, Input, Table).
  - `features/`: UI components theo nghiệp vụ (FoodCard, ChatBox).
- `services/`: Lớp gọi API (tách biệt logic xử lý dữ liệu với UI).
- `types/`: Định nghĩa kiểu dữ liệu TypeScript.
- `utils/`: Các hàm bổ trợ.

### 2. Backend (`my-web/backend/src`)
- `auth/`: Xử lý xác thực và phân quyền.
- `ai/`: Xử lý logic OpenAI và Vector Embeddings.
- `food/`: Quản lý nghiệp vụ món ăn.
- `prisma/`: Schema và kết nối Database.

---

## III. Luồng xử lý chính (Implementation Flow)

### 1. Luồng Tìm kiếm AI (RAG Flow)
1. **Người dùng:** Nhập yêu cầu bằng ngôn ngữ tự nhiên vào ChatBox.
2. **Backend:** Nhận yêu cầu và gọi OpenAI Embedding API để chuyển text thành vector.
3. **Database:** Thực hiện **Vector Search** trong PostgreSQL bằng `pgvector` để tìm các món ăn có độ tương đồng cao nhất.
4. **Backend:** Trả về danh sách món ăn kèm theo phản hồi từ AI.

### 2. Luồng Quản trị
- Admin đăng nhập và truy cập Panel chuyên biệt.
- Sử dụng Prisma Client để quản lý người dùng, thương gia và bài đăng.

---

## IV. Hướng dẫn vận hành nhanh
- **Backend:** `cd backend && npm run start:dev` (Port 3001).
- **Frontend:** `cd frontend && npm run dev` (Port 3000).
- **Database UI:** `cd backend && npx prisma studio`.
