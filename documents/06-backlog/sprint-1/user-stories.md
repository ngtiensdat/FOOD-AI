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

### US-05: Quên mật khẩu & Đặt lại mật khẩu
- **As a** người dùng quên mật khẩu
- **I want** yêu cầu liên kết đặt lại mật khẩu gửi về email của tôi
- **So that** tôi có thể đặt mật khẩu mới và lấy lại quyền truy cập tài khoản.

**Acceptance Criteria (AC):**
- [ ] UI Form "Quên mật khẩu" cho phép điền Email.
- [ ] Gửi email chứa token đặt lại mật khẩu (hoặc OTP reset).
- [ ] UI Form "Đặt lại mật khẩu" nhập mật khẩu mới và xác nhận mật khẩu mới.
- [ ] Vô hiệu hóa token đặt lại mật khẩu cũ sau khi mật khẩu mới được lưu thành công.

### US-06: Xác thực tài khoản qua Email
- **As a** người dùng mới đăng ký
- **I want** nhận được email kích hoạt tài khoản
- **So that** tôi có thể kích hoạt tài khoản của mình và chứng minh email là hợp lệ.

**Acceptance Criteria (AC):**
- [ ] Tự động gửi email chứa link hoặc mã kích hoạt tài khoản ngay sau khi đăng ký.
- [ ] UI trang thông báo yêu cầu xác thực email và form nhập mã kích hoạt (OTP/Verification code).
- [ ] Chặn các quyền truy cập của tài khoản chưa xác thực (nếu cấu hình bắt buộc xác thực).

### US-07: Quyền riêng tư & Xóa tài khoản cá nhân
- **As a** người dùng muốn ngừng sử dụng ứng dụng
- **I want** yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân của tôi
- **So that** thông tin cá nhân của tôi được bảo vệ và loại bỏ khỏi hệ thống.

**Acceptance Criteria (AC):**
- [x] UI nút "Xóa tài khoản" nằm trong phần thiết lập Hồ sơ cá nhân.
- [x] Modal cảnh báo và yêu cầu nhập lại mật khẩu hiện tại để xác nhận xóa.
- [x] Thực hiện Soft Delete hoặc Hard Delete tài khoản và các dữ liệu liên quan ở Backend.
- [x] Hủy phiên đăng nhập hiện tại và điều hướng về trang chủ sau khi xóa thành công.

---

## 2. Core UI & Layout

### US-03: Giao diện chính (Main Layout)
- **As a** người dùng
- **I want** một giao diện đồng nhất, dễ sử dụng và responsive
- **So that** tôi có thể trải nghiệm ứng dụng trên cả điện thoại và máy tính.

**Acceptance Criteria (AC):**
- [x] Sidebar/Navbar chứa các menu: Trang chủ, Khám phá, Cá nhân.
- [x] Header hiển thị thông tin người dùng và nút Đăng xuất.
- [x] Giao diện hỗ trợ Dark/Light Mode.
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

