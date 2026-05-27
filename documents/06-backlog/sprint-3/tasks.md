# Engineering Tasks - Sprint 3

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 3.

## 1. Discovery & Location

### [Backend]
- [x] Task 1.1: API lấy món ăn theo mục Trending (Today, Weekly).
- [x] Task 1.2: Logic tính khoảng cách trong VectorRepository.
- [x] Task 1.3: API hỗ trợ tìm kiếm theo khu vực (Quận/Huyện).

### [Frontend]
- [x] Task 1.4: UI Explore Page với bộ lọc Category.
- [x] Task 1.5: Hiển thị khoảng cách và nút Maps trên FoodCard.
- [x] Task 1.6: UI Trang hồ sơ công khai của Nhà hàng hiển thị toàn bộ danh sách thực đơn món ăn (Public Merchant Profile & Menu).

---

## 2. Profiles & History

### [Backend]
- [x] Task 2.1: API Profile cá nhân (Avatar, Bio).
- [x] Task 2.2: API lưu lịch sử xem món ăn (trackView).
- [x] Task 2.3: API Follow/Unfollow người dùng.
- [x] Task 2.4: API Public Merchant Profile: Lấy thông tin chung của Merchant và danh sách món ăn tương ứng.

### [Frontend]
- [x] Task 2.5: Trang Profile hiển thị thông tin và hoạt động.
- [x] Task 2.6: UI hiển thị danh sách Follow.
- [x] Task 2.7: UI hiển thị danh sách Lịch sử xem món trong Dashboard.

---

## 3. Backlog Hỗ Trợ Tùy Biến Cửa Hàng & Khám Phá Quán Ăn

*(Chi tiết xem đề xuất thiết kế tại: [restaurant-customization-proposal.md](file:///e:/FOOD_AI_code/documents/06-backlog/sprint-3/restaurant-customization-proposal.md))*

### A. Cơ sở dữ liệu (Database & Migration)
- [x] **Task 3.1 [Database]**: Cập nhật `schema.prisma` để thêm trường:
  - `logo` (`String?`) vào model `RestaurantProfile`.
  - `city` (`String?`) và `district` (`String?`) vào cả 2 model `Restaurant` và `Food` (phục vụ lọc địa điểm chuẩn xác - Constraint 6.1).
- [x] **Task 3.2 [Migration]**: Chạy lệnh `npx prisma db push` để cập nhật database SQLite và viết script di chuyển dữ liệu (data migration script) ngắn để bóc tách cột `address` hiện tại, tự động cập nhật `city` và `district` cho các bản ghi cũ.

### B. Backend API & Nghiệp vụ (Backend Component)
- [x] **Task 3.3 [DTO]**: Mở rộng `UpdateRestaurantProfileDto` nhận thêm các trường: `name`, `address`, `city`, `district`, `description`, `mapUrl`, `logo`, `coverImage`, `bio`, `contactEmail`, `contactPhone`, `openingHours` và cờ đồng bộ `syncWithPersonalAvatar` & `syncWithPersonalCover` (kiểu `boolean`).
- [x] **Task 3.4 [Repository]**: Cập nhật `findRestaurantByOwnerId` trong `FoodRepository` để trả về thêm các cột mới (`city`, `district`, `logo`).
- [x] **Task 3.5 [Repository - Transaction]**: Triển khai hàm `updateRestaurantProfileTransaction` sử dụng Prisma Transaction:
  - Cập nhật đồng bộ thông tin sang cả 2 bảng `Restaurant` và `RestaurantProfile`.
  - Nếu cờ `syncWithPersonalAvatar` là `true` và có `logo` mới, tiến hành cập nhật đồng bộ sang trường `avatar` của bảng `UserProfile` của chủ sở hữu (`userId = ownerId`).
  - Nếu cờ `syncWithPersonalCover` là `true` và có `coverImage` mới, tiến hành cập nhật đồng bộ sang trường `coverImage` của bảng `UserProfile` của chủ sở hữu (`userId = ownerId`).
- [x] **Task 3.6 [Repository - Search]**: Triển khai phương thức tìm kiếm danh sách cửa hàng công khai `findManyPublicRestaurants` hỗ trợ lọc theo:
  - Tìm kiếm tương đối theo tên nhà hàng (`contains` không phân biệt hoa thường).
  - Lọc chính xác theo tỉnh/thành (`city`) và quận/huyện (`district`).
  - Lọc theo tag/danh mục món ăn mà nhà hàng đó cung cấp.
- [x] **Task 3.7 [Service]**: Cập nhật `updateMyRestaurantProfile` và `getPublicRestaurants` trong `FoodService` để điều phối tham số và gọi các hàm mới từ `FoodRepository`.
- [x] **Task 3.8 [Controller]**: Khai báo public API `GET /restaurants` trong `RestaurantPublicController` nhận các query parameters: `search`, `city`, `district`, `tag` và trả về danh sách phân trang cửa hàng.

### C. Giao diện người dùng (Frontend Component)
- [x] **Task 3.9 [UI Component]**: Tạo component `EditRestaurantModal.tsx` cho Merchant chỉnh sửa đầy đủ thông tin quán ăn:
  - Giao diện trực quan nhập Tên, Bio, Mô tả, SĐT, Email, Link Maps, Ảnh bìa, Logo.
  * Tích hợp bộ chọn dropdown Tỉnh/Thành phố, Quận/Huyện chuẩn xác dựa trên dữ liệu hằng số `LOCATION_DATA`.
  * Có checkbox: **"Đồng bộ ảnh Logo này làm ảnh đại diện cá nhân"** gửi kèm `syncWithPersonalAvatar` và **"Đồng bộ ảnh bìa này làm ảnh bìa cá nhân"** gửi kèm `syncWithPersonalCover` cho API.
- [x] **Task 3.10 [Dashboard Integration]**: Tích hợp nút "Chỉnh sửa thông tin cửa hàng" và hiển thị `EditRestaurantModal` tại trang Dashboard `/restaurant-admin` của chủ quán.
- [x] **Task 3.11 [UI Card Component]**: Thiết kế component `RestaurantCard.tsx` hiển thị thông tin thương hiệu nhà hàng:
  - Ảnh bìa (Cover Image) làm nền mượt mà kèm hiệu ứng gradient.
  - Ảnh Logo hình tròn đè góc tinh tế.
  - Tên nhà hàng có tick xanh xác minh, số lượng followers, số món ăn hiện có, và các tag danh mục tiêu biểu.
  - Chuyển hướng sang `/restaurant/[id]` khi click vào card.
- [x] **Task 3.12 [Explore Page]**: Cải tiến trang khám phá `/explore` và hook `useExploreActions.ts`:
  - Thay đổi logic gọi API từ lấy món ăn (`getAllFoods`) sang lấy danh sách cửa hàng công khai (`getPublicRestaurants`).
  - Cập nhật Grid hiển thị để kết xuất danh sách `RestaurantCard` thay vì `FoodCard`.
- [x] **Task 3.13 [Profile Integration]**: Thêm checkbox **"Đồng bộ ảnh đại diện này làm Logo của quán ăn"** và **"Đồng bộ ảnh bìa này làm ảnh bìa của quán ăn"** vào `EditProfileModal` tại trang cá nhân `/profile` để đồng bộ ngược lại từ phía cá nhân sang nhà hàng.

