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
- [x] Xóa món ăn khỏi thực đơn.

### US-08: Công cụ quản trị hệ thống (Admin Tools)
- **As a** Admin
- **I want** quản lý toàn bộ người dùng và món ăn trên hệ thống
- **So that** duy trì chất lượng nội dung và an ninh cho ứng dụng.

**Acceptance Criteria (AC):**
- [x] Xem danh sách và quản lý tất cả User (Customer/Merchant).
- [x] Xem danh sách và quản lý tất cả món ăn (System Menu & Merchant Menu).
- [x] Tính năng Recommend món ăn để đẩy lên các mục nổi bật.

---

## 3. Nâng cấp bổ sung (Enhancements)

### US-08+: Cải thiện UX quản lý món ăn đối tác (Admin)
- **As a** Admin
- **I want** danh sách món ăn đối tác được phân nhóm theo tên Merchant và có thông báo trực quan khi cần phê duyệt
- **So that** tôi có thể dễ dàng quản lý khi số lượng merchant và món ăn tăng lên.

**Acceptance Criteria (AC):**
- [x] Món ăn đối tác được nhóm theo tên Merchant, sắp xếp theo bảng chữ cái.
- [x] Mỗi nhóm có thể Thu gọn/Mở rộng (Accordion), mặc định đóng.
- [x] Badge "CẦN DUYỆT" nhấp nháy (pulse) hiển thị bên cạnh tên Merchant khi có món ở trạng thái PENDING.

### US-08++: Chống crash & Hardening hệ thống
- **As a** Admin/Merchant
- **I want** hệ thống không bị crash khi dữ liệu đầu vào không hợp lệ
- **So that** trải nghiệm sử dụng không bị gián đoạn.

**Acceptance Criteria (AC):**
- [x] URL ảnh không hợp lệ (ví dụ: `"a"`) được tự động thay bằng ảnh mặc định thay vì crash trang.
- [x] Hàm `getValidImageUrl()` được tích hợp vào tất cả component hiển thị ảnh từ database.
- [x] Nút Xóa món ăn/Xóa người dùng hiển thị Modal xác nhận (ConfirmModal) thay vì `window.confirm` thô sơ.
- [x] Toàn bộ chuỗi hiển thị hardcode được chuyển vào `LABELS` constants.
- [x] Tất cả thẻ `<img>` được thay bằng `next/image` theo chuẩn `.agent` rule.
