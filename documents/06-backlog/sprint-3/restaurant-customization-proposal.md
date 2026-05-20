# Đề Xuất Cải Tiến: Tùy Biến Cửa Hàng & Công Cụ Khám Phá Nhà Hàng (Sprint 3)

Tài liệu này tổng hợp toàn bộ ý tưởng đổi mới, thiết kế luồng hoạt động và phương án nâng cấp cơ sở dữ liệu nhằm nâng cao trải nghiệm của Merchant (chủ quán) và Khách hàng khi tương tác với các trang quán ăn.

---

## 1. Bối Cảnh & Mục Tiêu

Hiện tại hệ thống đã hỗ trợ trang hiển thị công khai thông tin quán ăn (`/restaurant/[id]`) và trang quản trị của Merchant (`/restaurant-admin`). Tuy nhiên, Merchant còn gặp nhiều hạn chế:
- Chưa thể tùy chỉnh thông tin quán ăn như Tên, Ảnh bìa, Giới thiệu, Địa chỉ, Email và Bản đồ chỉ đường (chỉ sửa được giờ mở cửa).
- Chưa hỗ trợ tải lên hoặc cập nhật Logo/Avatar riêng cho quán ăn.
- Trang Khám phá (`/explore`) hiện đang hiển thị danh sách các món ăn đơn lẻ thay vì tập trung hiển thị các **Trang nhà hàng công khai** (như cách hoạt động của Facebook Pages).

**Mục tiêu đổi mới:**
- Cung cấp giải pháp quản trị toàn diện cho chủ quán.
- Cải tiến trang Khám phá thành cổng kết nối trực tiếp khách hàng đến các thương hiệu nhà hàng.

---

## 2. Các Ý Tưởng Cải Tiến Chi Tiết

### Ý tưởng 1: Bộ Công Cụ Tùy Biến Cửa Hàng (Merchant Customization)
- Cung cấp giao diện chỉnh sửa trực quan (Modal/Form) ngay tại Dashboard `/restaurant-admin`.
- Merchant có thể chỉnh sửa:
  - **Tên nhà hàng** (Restaurant Name).
  - **Ảnh bìa** (Cover Image) & **Logo/Avatar** riêng của quán.
  - **Mô tả ngắn** & **Bài giới thiệu chi tiết** (Bio).
  - **Thông tin liên hệ:** Số điện thoại, Email.
  - **Thông tin vận hành:** Giờ đóng/mở cửa, địa chỉ bản đồ Google Maps.

### Ý tưởng 2: Cải Tiến Trang Khám Phá Quán Ăn (Explore Restaurants)
- Chuyển đổi trang `/explore` thành trang tìm kiếm và liệt kê các **Trang quán ăn** (`RestaurantCard`).
- **Luồng tìm kiếm & lọc thông tin:**
  - *Tìm kiếm:* Gõ tìm kiếm theo tên nhà hàng.
  - *Lọc theo khu vực:* Lọc chuẩn xác theo Tỉnh/Thành phố và Quận/Huyện.
  - *Lọc theo danh mục:* Khi người dùng chọn một Danh mục (ví dụ: Pizza) ở Trang chủ, hệ thống tự động lọc ra các **nhà hàng đang bán món ăn thuộc danh mục đó**.

---

## 3. Đề Xuất Cải Tiến Prisma Database Schema

Để hỗ trợ đầy đủ các tính năng trên một cách tối ưu và chuẩn hóa dữ liệu, chúng ta cần nâng cấp cấu trúc cơ sở dữ liệu trong `schema.prisma`:

### A. Bổ sung Logo/Avatar của Quán ăn
Thêm cột `logo` (hoặc `logoUrl` dạng `String?`) vào bảng `RestaurantProfile`.

### B. Tách Cột Địa Chỉ Để Lọc Chuẩn Xác (Constraint 6.1)
Thay vì lưu chung một chuỗi `address` dài và tìm kiếm bằng phương thức so sánh chuỗi tương đối (`contains`), chúng ta thêm các trường có cấu trúc:
- `city` (Tỉnh / Thành phố)
- `district` (Quận / Huyện)

vào trực tiếp hai bảng `Restaurant` và `Food`.

### Chi tiết thay đổi Schema đề xuất:
```prisma
// ================== RESTAURANT ==================
model Restaurant {
  id          Int      @id @default(autoincrement())
  name        String
  address     String
  city        String?  // <-- Thêm mới: Tỉnh/Thành phố phục vụ lọc chính xác
  district    String?  // <-- Thêm mới: Quận/Huyện phục vụ lọc chính xác
  latitude    Float
  longitude   Float
  description String?
  mapUrl      String?     @map("map_url")
  ...
}

// ================== RESTAURANT PROFILE ==================
model RestaurantProfile {
  restaurantId Int      @id @map("restaurant_id")
  logo         String?  // <-- Thêm mới: Logo/Avatar quán ăn
  coverImage   String?  @map("cover_image")
  bio          String?
  openingHours String?  @map("opening_hours")
  contactEmail String?  @map("contact_email")
  contactPhone String?  @map("contact_phone")
  ...
}
```

---

## 4. Thiết Kế Kiến Trúc Hệ Thống

### A. API Endpoints (Backend)
1. **PATCH `/restaurants/my-restaurant/profile`**:
   - Nhận DTO mở rộng: `{ name, address, city, district, description, mapUrl, logo, coverImage, bio, contactEmail, contactPhone, openingHours }`.
   - Backend sử dụng Prisma Transaction cập nhật đồng bộ sang cả 2 bảng `Restaurant` và `RestaurantProfile`.
2. **GET `/restaurants`**:
   - API công khai cho phép tìm kiếm nhà hàng theo các query: `?search=...&tag=...&city=...&district=...`.

### B. Giao Diện & Trải Nghiệm (Frontend)
- **`EditRestaurantModal.tsx`**: Modal nhập liệu và tải ảnh (Cover/Logo) thân thiện, tích hợp xác thực dữ liệu đầu vào.
- **`RestaurantCard.tsx`**: Hiển thị ảnh bìa nổi bật, Avatar tròn đè góc, Tên quán ăn kèm dấu tích xác minh (nếu có), số lượng người theo dõi, số lượng thực đơn và tag món ăn tiêu biểu.
