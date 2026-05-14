# Kiến trúc Frontend - FOOD AI

Tài liệu này mô tả chi tiết cách tổ chức và hoạt động của lớp Client.

## 1. Công nghệ sử dụng
- **Framework:** Next.js 16+ (App Router).
- **Styling:** Tailwind CSS v4 (Utility-first).
- **Icons:** Lucide React.
- **Animation:** Framer Motion.
- **HTTP Client:** Fetch API (kết hợp với `api-client.ts`).

## 2. Cấu trúc thư mục (`src/`)
- `app/`: Quản lý Routing và Layout.
  - `(auth)`: Login, Register.
  - `explore/`: Trang tìm kiếm và gợi ý món ăn.
  - `dashboard/`: Trang dành cho người dùng/thương gia.
- `components/`:
  - `base/`: Các UI components nguyên tử (Button, Input).
  - `shared/`: Các thành phần dùng chung (Navbar, Footer).
- `services/`: Lớp logic gọi API (ví dụ: `food.service.ts`).
- `hooks/`: Các Custom Hooks để quản lý trạng thái và logic UI.
- `lib/`: Chứa cấu hình thư viện bên thứ ba (Prisma, API Client).

## 3. Luồng dữ liệu (Data Flow)
1. **User Interaction:** Người dùng thao tác trên UI.
2. **Component:** Gọi hàm từ thư mục `services/`.
3. **Service:** Sử dụng `api-client.ts` để gửi request đến Backend.
4. **UI Update:** Cập nhật giao diện dựa trên dữ liệu trả về.
