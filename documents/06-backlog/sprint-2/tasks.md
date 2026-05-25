# Engineering Tasks - Sprint 2

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 2.

## 1. Merchant Onboarding & Management

### [Backend]
- [x] Task 1.1: API đăng ký vai trò Merchant và gửi hồ sơ.
- [x] Task 1.2: API CRUD món ăn (Create, Read, Update).
- [x] Task 1.3: API cập nhật trạng thái Đóng/Mở cửa của nhà hàng.

### [Frontend]
- [x] Task 1.4: UI Merchant Hub: Dashboard tổng quan và quản lý thực đơn.
- [x] Task 1.5: UI Quản lý trạng thái món ăn (Còn/Hết).
- [x] Task 1.6: UI Nút gạt Đóng/Mở cửa nhà hàng trên Dashboard.

---

## 2. Administration Tools

### [Backend]
- [x] Task 2.1: API Admin quản lý danh sách Merchant PENDING.
- [x] Task 2.2: API Admin gỡ bài đăng hoặc bình luận vi phạm.
- [x] Task 2.3: API Admin Recommend món ăn nổi bật.

### [Frontend]
- [x] Task 2.4: UI Admin Dashboard: Duyệt Merchant và quản lý người dùng.
- [x] Task 2.5: UI Admin: Quản lý món ăn toàn hệ thống.

---

## 3. Nâng cấp bổ sung (Enhancements)

### [Frontend]
- [x] Task 3.1: Phân nhóm món ăn đối tác theo tên Merchant (Accordion, mặc định đóng).
- [x] Task 3.2: Badge "CẦN DUYỆT" (pulse animation) trên tiêu đề nhóm Merchant có món PENDING.
- [x] Task 3.3: Tạo hàm `getValidImageUrl()` và tích hợp vào 6 component chống crash từ URL ảnh không hợp lệ.
- [x] Task 3.4: Thay thế `window.confirm` bằng `ConfirmModal` component cho hành động xóa.
- [x] Task 3.5: Chuyển toàn bộ chuỗi hardcode ("Food AI", "CẦN DUYỆT", message...) vào `LABELS` constants.
- [x] Task 3.6: Thay tất cả thẻ `<img>` vi phạm bằng `next/image` (Footer, Profile, Admin).

### [Backend]
- [x] Task 3.7: Cập nhật `AdminUpdateFoodDto` thêm `isFeaturedToday`, `isAdminRecommended` để tránh bị ValidationPipe strip.
- [x] Task 3.8: Đồng bộ `AdminService.updateFood` với DTO mới.
