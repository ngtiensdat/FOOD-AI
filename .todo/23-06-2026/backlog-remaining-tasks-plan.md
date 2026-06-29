# Kế hoạch Triển khai: Giải quyết Backlog Chưa Hoàn Thành (Dinh dưỡng Món ăn & Tối ưu Responsive Mobile)

Tài liệu này lên kế hoạch chi tiết để hoàn thiện hai đầu việc còn dang dở trong Backlog dự án: hiển thị thông tin dinh dưỡng món ăn và tối ưu hóa hiển thị responsive trên thiết bị di động.

---

## 1. Hiển Thị Chi Tiết Dinh Dưỡng Món Ăn (Calo, Macro) Qua Modal

### [x] BƯỚC 1: Cập nhật Schema Cơ sở dữ liệu (Prisma Backend)
* **File cần sửa**: `my-web/backend/prisma/schema.prisma`
* **Nội dung**: Bổ sung các trường dinh dưỡng vào model `Food`:
  ```prisma
  model Food {
    id                 Int                    @id @default(autoincrement())
    // ... (các trường cũ)
    calories           Float?                 @default(0) // Hàm lượng Calo (kcal)
    carbs              Float?                 @default(0) // Carbohydrates (g)
    protein            Float?                 @default(0) // Protein (g)
    fat                Float?                 @default(0) // Fat (g)
    // ... (các trường cũ)
  }
  ```
* **Chạy di chuyển DB**:
  ```bash
  npx prisma db push
  npx prisma generate
  ```

### [x] BƯỚC 2: Cập nhật DTO & Service tại Backend
* **Cập nhật Validation**: Bổ sung các decorator `@IsNumber()`, `@IsOptional()` vào create/update Food DTOs.
* **Cập nhật Excel Import**: Điều chỉnh hàm đọc Excel tại `FoodService` để hỗ trợ nhập các cột `Calo`, `Carbs`, `Protein`, `Fat` từ file Excel của Merchant.

### [x] BƯỚC 3: Thiết kế Giao diện Chi tiết Dinh dưỡng (Frontend Modal)
* **Tạo Component hiển thị Macro**:
  Thiết kế một widget đẹp mắt hiển thị tỷ lệ dinh dưỡng (ví dụ: vòng tròn tiến trình hoặc các thanh trượt màu sắc cho Carbs, Protein, Fat) kèm chỉ số Calo lớn nổi bật.
* **Tích hợp vào Food Details Modal**:
  Khi người dùng nhấn xem món ăn, hiển thị bảng phân tích dinh dưỡng này để giúp thực khách ăn uống lành mạnh kiểm soát được chế độ ăn.

---

## 2. Tối Ưu Hóa Responsive Đầy Đủ Trên Thiết Bị Di Động (Mobile)

### [x] BƯỚC 1: Tối ưu hóa Sidebar trên màn hình di động (< 768px)
* **Vấn đề hiện tại**: Sidebar dù thu gọn về `w-20` vẫn chiếm khoảng không gian 80px trên màn hình điện thoại vốn rất chật hẹp.
* **Giải pháp**:
  - Trên màn hình di động (`max-width: 767px`), ẩn hoàn toàn Sidebar cố định.
  - Chuyển Sidebar thành một **Drawer menu di động (Floating Drawer)** vuốt từ cạnh trái ra khi người dùng click vào icon Hamburger trên Navbar.
  - Sử dụng Tailwind classes: `hidden md:flex` cho sidebar cố định, và một trigger drawer riêng cho mobile.

### [x] BƯỚC 2: Tối ưu co giãn cho Modals và Bảng Biểu
* **Modals**: Cấu hình các Modal (Edit Restaurant, Category Manager) tự động đạt chiều rộng `w-[92%]` hoặc `w-full` kèm margin/padding nhỏ khi xem trên Mobile để tránh bị tràn viền hoặc vỡ bố cục.
* **Bảng biểu (AdminTable/MenuTable)**: 
  - Bọc các bảng dữ liệu bằng thẻ div có thuộc tính `overflow-x-auto` để hỗ trợ cuộn ngang mượt mà trên điện thoại.
  - Ẩn bớt các cột không quan trọng trên màn hình nhỏ (ví dụ: ngày tạo, ID) bằng class `hidden sm:table-cell`.
