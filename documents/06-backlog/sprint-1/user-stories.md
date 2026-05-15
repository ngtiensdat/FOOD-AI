# User Stories - Sprint 1

**Mục tiêu Sprint:** Thiết lập giao diện đăng nhập, đăng ký, trang Home và tạo kết nối với database và server, và sau khi đăng nhập thành công sẽ điều hướng về trang Home hoặc trang trước đó nếu là role Merchant.

---

## 1. Authentication (Đăng nhập & Đăng ký)

### US-01: Đăng ký tài khoản mới
- **As a** khách truy cập
- **I want** tạo tài khoản mới bằng email và mật khẩu
- **So that** tôi có thể sử dụng các tính năng cá nhân hóa của Food AI.

**Acceptance Criteria (AC):**
- [x] Form đăng ký có đầy đủ các trường: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu.
- [x] Validate dữ liệu đầu vào (Email đúng định dạng, Mật khẩu tối thiểu 8 ký tự).
- [x] Hiển thị thông báo lỗi nếu email đã tồn tại.
- [x] Mã hóa mật khẩu trước khi lưu vào database.
- [x] Tự động đăng nhập và điều hướng về Dashboard sau khi đăng ký thành công.
- [ ] Xác thực email người dùng để bảo mật và tránh spam, lạm dụng tài khoản 

### US-02: Đăng nhập hệ thống
- **As a** người dùng đã có tài khoản
- **I want** đăng nhập vào hệ thống
- **So that** tôi có thể truy cập vào dữ liệu cá nhân của mình.

**Acceptance Criteria (AC):**
- [x] Đăng nhập bằng Email và Mật khẩu.
- [x] Xử lý JWT Token (HttpOnly Cookie) để duy trì phiên đăng nhập.
- [x] Hiển thị thông báo lỗi khi sai thông tin đăng nhập.
- [x] Khóa tạm thời tài khoản sau 5 lần đăng nhập sai

---

## 2. Core UI & Layout

### US-03: Giao diện chính (Main Layout)
- **As a** người dùng
- **I want** một giao diện đồng nhất, dễ sử dụng và responsive
- **So that** tôi có thể trải nghiệm ứng dụng trên cả điện thoại và máy tính.

**Acceptance Criteria (AC):**
- [x] Sidebar/Navbar chứa các menu: Trang chủ, Khám phá, Cá nhân.
- [x] Header hiển thị thông tin người dùng và nút Đăng xuất.
- [ ] Giao diện hỗ trợ Dark/Light Mode.
- [ ] Responsive tốt trên Mobile, Tablet và Desktop.

### US-04: Trang chủ & Danh sách món ăn mẫu
- **As a** người dùng
- **I want** xem danh sách các món ăn gợi ý trên trang chủ
- **So that** tôi có thể bắt đầu tìm hiểu về dinh dưỡng.

**Acceptance Criteria (AC):**
- [x] Hiển thị Grid danh sách món ăn với hình ảnh, tên và mô tả.
- [x] Có thanh tìm kiếm nhanh món ăn theo tên.
- [x] Hiệu ứng loading skeleton khi đang tải dữ liệu.
- [x] Có thanh chat với AI

