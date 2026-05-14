# Use Case - Quản trị viên (Admin)

Tài liệu mô tả chi tiết các kịch bản sử dụng cho Admin.

---

## UC_01: Đăng nhập vào hệ thống

### 1. Objective
Cho phép Admin truy cập vào hệ thống quản trị để thực hiện các công việc điều hành.

### 2. Actors
Quản trị viên (Admin).

### 3. Preconditions
- Admin đã có tài khoản được cấp quyền quản trị trong Database.
- Thiết bị có kết nối Internet và truy cập đúng đường dẫn trang Admin.

### 4. Main Flow
1. Admin truy cập trang đăng nhập dành cho quản trị viên.
2. Admin nhập Email và Mật khẩu.
3. Admin nhấn nút "Đăng nhập".
4. Hệ thống kiểm tra thông tin và quyền hạn (Role).
5. Hệ thống điều hướng Admin vào trang Dashboard quản trị.

### 5. Alternative Flow
- **Trường hợp sai thông tin:** Nếu Email hoặc Mật khẩu không đúng, hệ thống hiển thị thông báo lỗi "Thông tin đăng nhập không chính xác".
- **Trường hợp không có quyền Admin:** Nếu tài khoản hợp lệ nhưng không có Role là ADMIN, hệ thống từ chối truy cập và thông báo "Bạn không có quyền truy cập vào khu vực này".

### 6. Postconditions
Admin đăng nhập thành công và nhận được Access Token để thực hiện các thao tác tiếp theo.

---

## UC_02: Quản lý tài khoản người dùng (Customer và Merchant)

### 1. Objective
Giúp Admin theo dõi, chỉnh sửa hoặc khóa các tài khoản vi phạm chính sách.

### 2. Actors
Quản trị viên (Admin).

### 3. Preconditions
Admin đã đăng nhập thành công vào hệ thống.

### 4. Main Flow
1. Admin truy cập mục "Quản lý người dùng".
2. Hệ thống hiển thị danh sách toàn bộ Customer và Merchant.
3. Admin có thể tìm kiếm theo tên hoặc email.
4. Admin chọn một tài khoản cụ thể để xem chi tiết.
5. Admin thực hiện thay đổi thông tin hoặc đổi trạng thái tài khoản (Active/Banned).
6. Admin nhấn "Lưu".

### 5. Alternative Flow
- **Hủy thao tác:** Admin nhấn "Hủy", hệ thống quay lại danh sách và không lưu thay đổi.

### 6. Postconditions
Thông tin người dùng được cập nhật trong Database.

---

## UC_03: Quản lý các bài đăng (Posts)

### 1. Objective
Admin có quyền can thiệp vào các nội dung trên hệ thống để đảm bảo chất lượng thông tin.

### 2. Actors
Quản trị viên.

### 3. Preconditions
Admin đang ở trang Quản lý nội dung.

### 4. Main Flow
1. Admin xem danh sách các bài đăng (review, giới thiệu món ăn).
2. Admin chọn bài đăng cần chỉnh sửa hoặc xóa.
3. Admin thực hiện thay đổi nội dung hoặc nhấn nút "Xóa bài".
4. Hệ thống yêu cầu xác nhận nếu là thao tác xóa.
5. Admin xác nhận thao tác.

### 5. Alternative Flow
- Nếu Admin từ chối xác nhận xóa, bài đăng vẫn được giữ nguyên.

### 6. Postconditions
Nội dung bài đăng bị xóa hoặc thay đổi trên toàn hệ thống.

---

## UC_04: Kiểm duyệt Merchant mới

### 1. Objective
Xác minh danh tính và tính hợp pháp của các nhà hàng trước khi cho phép kinh doanh trên nền tảng.

### 2. Actors
Quản trị viên.

### 3. Preconditions
Có Merchant đăng ký mới và đang ở trạng thái `PENDING`.

### 4. Main Flow
1. Admin truy cập danh sách "Chờ phê duyệt Merchant".
2. Admin xem hồ sơ và các giấy tờ pháp lý (Legal Documents) của Merchant.
3. Admin đánh giá tính hợp lệ.
4. Admin nhấn "Phê duyệt" hoặc "Từ chối".
5. Nếu từ chối, Admin nhập lý do (ví dụ: Thiếu giấy phép kinh doanh).
6. Hệ thống gửi email thông báo kết quả cho Merchant.

### 5. Alternative Flow
- **Merchant không đạt yêu cầu:** Trạng thái chuyển thành `REJECTED`, Merchant phải cập nhật lại hồ sơ.

### 6. Postconditions
Merchant được cấp quyền đăng bán món ăn (nếu Approved).

---

## UC_05: Kiểm duyệt bài đăng của Merchant

### 1. Objective
Đảm bảo các món ăn hoặc bài quảng cáo của Merchant không vi phạm quy định về hình ảnh/nội dung.

### 2. Actors
Quản trị viên.

### 3. Preconditions
Merchant tạo bài đăng mới ở chế độ cần kiểm duyệt.

### 4. Main Flow
1. Admin nhận thông báo có nội dung mới cần duyệt.
2. Admin xem hình ảnh và nội dung bài viết.
3. Admin nhấn "Duyệt" để bài đăng hiển thị công khai.
4. Hệ thống hiển thị bài đăng lên trang chủ/trang khám phá.

### 5. Alternative Flow
- **Nội dung không phù hợp:** Admin từ chối bài đăng và yêu cầu Merchant chỉnh sửa.

### 6. Postconditions
Bài đăng được hiển thị công khai hoặc bị ẩn.

---

## UC_06: Xử lý báo cáo về review không đúng sự thật

### 1. Objective
Bảo vệ uy tín của Merchant trước các hành vi review ảo hoặc chơi xấu từ đối thủ.

### 2. Actors
Quản trị viên.

### 3. Preconditions
Merchant gửi báo cáo (Report) về một bài review cụ thể.

### 4. Main Flow
1. Admin truy cập danh sách "Báo cáo vi phạm".
2. Admin xem nội dung bài review bị báo cáo và lý do từ Merchant.
3. Admin kiểm tra bằng chứng (hình ảnh, lịch sử mua hàng).
4. Admin quyết định: Giữ nguyên review hoặc Xóa review vi phạm.
5. Admin cập nhật trạng thái báo cáo là `RESOLVED`.

### 5. Alternative Flow
- **Báo cáo không hợp lệ:** Admin bác bỏ báo cáo và giữ nguyên bài review của khách hàng.

### 6. Postconditions
Bài review bị xóa (nếu vi phạm) và thông báo kết quả cho các bên liên quan.
