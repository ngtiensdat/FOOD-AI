# User Stories - Sprint 2

**Mục tiêu Sprint:** Hoàn thiện hệ thống dành cho đối tác (Merchant) và các công cụ quản trị hệ thống (Admin) để quản lý nội dung và người dùng.

---

## 1. Merchant Onboarding (Đăng ký đối tác)

### US-05: Đăng ký tài khoản Merchant
- **As a** chủ nhà hàng
- **I want** đăng ký tài khoản với vai trò Merchant và gửi hồ sơ pháp lý
- **So that** tôi có thể đưa nhà hàng và món ăn của mình lên nền tảng.

**Acceptance Criteria (AC):**
- [x] Chọn vai trò "Restaurant/Merchant" khi đăng ký.
- [x] Yêu cầu cung cấp thêm thông tin: Tên nhà hàng, Địa chỉ, Tài liệu pháp lý.
- [x] Sau khi đăng ký thành công, tài khoản ở trạng thái PENDING.

### US-06: Phê duyệt Merchant (Admin flow)
- **As a** Admin hệ thống
- **I want** xem danh sách các yêu cầu đăng ký Merchant và phê duyệt hoặc từ chối
- **So that** đảm bảo các nhà hàng trên hệ thống là hợp pháp.

**Acceptance Criteria (AC):**
- [x] Danh sách các tài khoản Merchant đang chờ (PENDING).
- [x] Có nút Phê duyệt (APPROVED) hoặc Từ chối (REJECTED).

---

## 2. Menu & User Management (Quản lý thực đơn và người dùng)

### US-07: Quản lý danh sách món ăn (Merchant)
- **As a** Merchant đã được phê duyệt
- **I want** thêm và sửa các món ăn trong thực đơn của mình
- **So that** tôi có thể cập nhật món ăn mới hoặc thay đổi giá cả.

**Acceptance Criteria (AC):**
- [x] Form thêm món ăn mới: Tên, Giá, Mô tả, Hình ảnh, Tags.
- [x] Chỉnh sửa thông tin món ăn hiện có.
- [ ] Xóa hoặc ẩn món ăn khỏi thực đơn (Soft delete).

### US-08: Công cụ quản trị hệ thống (Admin Tools)
- **As a** Admin
- **I want** quản lý toàn bộ người dùng và món ăn trên hệ thống
- **So that** duy trì chất lượng nội dung và an ninh cho ứng dụng.

**Acceptance Criteria (AC):**
- [x] Xem danh sách và quản lý tất cả User (Customer/Merchant).
- [x] Xem danh sách và quản lý tất cả món ăn (System Menu & Merchant Menu).
- [x] Tính năng Recommend món ăn để đẩy lên các mục nổi bật.
