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

### [Backend]
- [ ] Task 3.1: Mở rộng DTO và API `/restaurants/my-restaurant/profile` để cập nhật đồng thời bảng `Restaurant` (Tên, Địa chỉ, Mô tả, Bản đồ...) và bảng `RestaurantProfile` (Ảnh bìa, Bio, Email...).
- [ ] Task 3.2: API public `@Get('restaurants')` để tìm kiếm và trả về danh sách các cửa hàng công khai (Hỗ trợ lọc theo tên, thành phố, quận/huyện, và tag món ăn).

### [Frontend]
- [ ] Task 3.3: Tạo Component `EditRestaurantModal.tsx` để chỉnh sửa đầy đủ thông tin cửa hàng cho Merchant.
- [ ] Task 3.4: Tích hợp `EditRestaurantModal.tsx` vào trang quản trị Dashboard `/restaurant-admin`.
- [ ] Task 3.5: Chuyển đổi trang Khám phá `/explore` từ tìm kiếm món ăn sang tìm kiếm danh sách các nhà hàng công khai (`RestaurantCard`).
