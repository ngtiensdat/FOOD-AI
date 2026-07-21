# Đánh giá & Kế hoạch Phát triển các Tính năng Nghiệp vụ còn thiếu (Gaps Analysis)

Tài liệu này phân tích các lỗ hổng nghiệp vụ hiện tại giữa các vai trò (Khách hàng, Thương gia, Nhân viên) và đề xuất các giải pháp kỹ thuật cụ thể để vận hành hệ thống **FOOD AI** một cách chuyên nghiệp, mượt mà và trơn tru nhất.

---

## I. Phân hệ Khách hàng (Customer Segment)

### 1. Hệ thống Lịch sử Giao dịch Điểm & Voucher (Loyalty Transaction Ledger)
* **Thực trạng:** Khách hàng có thể đổi voucher và nhận điểm thưởng từ mã 6 số, nhưng chưa có nơi xem chi tiết biến động số dư điểm (ví dụ: +50 điểm lúc 12:00 do quét mã nhà hàng A, -200 điểm lúc 14:00 để đổi voucher B).
* **Giải pháp đề xuất:**
  * Tạo bảng `PointTransaction` lưu lịch sử cộng/trừ điểm kèm loại giao dịch (`CLAIM_CODE`, `REDEEM_VOUCHER`, `REFUND`).
  * Xây dựng trang "Lịch sử tích lũy" trong ví Voucher của khách hàng.

### 2. Định danh & Tích điểm nhanh không cần Đăng nhập (Guest Loyalty Flow)
* **Thực trạng:** Khách hàng vãng lai ăn tại quán muốn tích điểm nhanh phải tải app, đăng ký tài khoản và đăng nhập rất mất thời gian.
* **Giải pháp đề xuất:**
  * Cho phép khách quét mã QR để tích điểm vào "Ví tạm thời" lưu ở LocalStorage/Cookie của trình duyệt điện thoại.
  * Khi khách hàng đăng ký tài khoản chính thức bằng số điện thoại/Email sau đó, hệ thống sẽ tự động đồng bộ (merge) số điểm tích lũy tạm thời vào tài khoản chính thức.

### 3. Đánh giá chất lượng dịch vụ sau khi thanh toán (Order Review & Rating)
* **Thực trạng:** Sau khi nhân viên hoàn thành đơn hàng trên POS, khách hàng chưa có cơ chế phản hồi/đánh giá chất lượng đồ ăn và thái độ phục vụ của nhân viên đó.
* **Giải pháp đề xuất:**
  * Gửi một thông báo đẩy hoặc hiển thị popup đánh giá (1-5 sao kèm bình luận) ngay khi đơn hàng chuyển sang trạng thái hoàn thành (`COMPLETED`).
  * Điểm đánh giá này sẽ được liên kết trực tiếp để tính KPI cho nhân viên phục vụ và hiển thị chất lượng món ăn trên trang khám phá.

---

## II. Phân hệ Thương gia (Merchant Segment)

### 1. Ràng buộc Hóa đơn thực tế với mã tích điểm (Invoice-to-Point Binding)
* **Thực trạng:** Hiện tại chủ quán có thể tự tạo mã 6 số với số điểm bất kỳ mà không cần liên kết với giao dịch thực tế. Điều này tạo kẽ hở cho nhân viên tự tạo mã điểm cao để trục lợi cá nhân hoặc hack điểm.
* **Giải pháp đề xuất:**
  * Khi tạo mã tích điểm (`generatePointCode`), bắt buộc phải truyền vào `orderId` hoặc số tiền trên hóa đơn thanh toán thực tế.
  * Tỷ lệ quy đổi điểm phải được cấu hình cố định trên toàn hệ thống (ví dụ: 10.000đ hóa đơn = 1 điểm). Không cho phép nhân viên nhập tay số điểm tùy ý.

### 2. Đối soát tài chính & Doanh thu (Financial Settlement & Reports)
* **Thực trạng:** Chưa có hệ thống thống kê doanh thu bán hàng tại quầy (qua POS) và doanh số quy đổi từ voucher (giảm trừ doanh thu) để phục vụ việc tính toán lãi lỗ và báo cáo thuế của Merchant.
* **Giải pháp đề xuất:**
  * Xây dựng dashboard báo cáo tài chính hiển thị: Tổng doanh thu, Doanh thu tiền mặt, Doanh thu chuyển khoản, Tiền chiết khấu do Voucher, Phí hệ thống.
  * Hỗ trợ xuất dữ liệu báo cáo ra file Excel theo ngày/tháng/năm để kế toán đối soát.

### 3. Cảnh báo tồn kho thời gian thực (Real-time Inventory Low Alert)
* **Thực trạng:** Hệ thống POS đã trừ nguyên liệu kho khi bán món ăn, nhưng nếu nguyên liệu đạt mức tối thiểu (ngưỡng an toàn), hệ thống chưa cảnh báo cho chủ quán hoặc bếp biết để nhập thêm hàng.
* **Giải pháp đề xuất:**
  * Thiết lập trường `lowStockThreshold` cho mỗi nguyên vật liệu trong kho.
  * Khi số lượng tồn kho giảm xuống dưới ngưỡng này, hệ thống sẽ tự động gửi thông báo đẩy (real-time notification) đến tài khoản của Merchant và Quản lý kho.

---

## III. Phân hệ Nhân viên (Staff Segment)

### 1. Màn hình hiển thị Bếp (Kitchen Display System - KDS)
* **Thực trạng:** Nhân viên order món tại bàn hoặc quầy thu ngân qua POS, thông tin đơn hàng mới chỉ lưu vào database chứ chưa được truyền đạt tự động xuống nhà bếp. Bếp vẫn phải nhận order bằng giấy in nhiệt hoặc truyền miệng thủ công.
* **Giải pháp đề xuất:**
  * Xây dựng giao diện **Kitchen Mode** dành riêng cho máy tính bảng/màn hình đặt dưới bếp.
  * Khi có đơn hàng mới từ POS, màn hình bếp sẽ lập tức hiển thị danh sách món cần làm (sắp xếp theo thời gian order và phân loại theo khu vực bếp nước/bếp nướng).
  * Đầu bếp làm xong món nào thì chạm màn hình để đánh dấu "Hoàn thành chế biến" -> Hệ thống tự động bắn thông báo đến thiết bị POS của nhân viên phục vụ để đi bê món ra bàn.

### 2. Bàn giao ca & Đối soát quỹ tiền mặt (Shift Handover & Cash Reconciliation)
* **Thực trạng:** Nhiều nhân viên phục vụ hoặc thu ngân sử dụng chung một máy POS trong các ca làm việc khác nhau, dễ dẫn đến thất thoát tiền mặt mà không rõ trách nhiệm thuộc về ai.
* **Giải pháp đề xuất:**
  * Xây dựng tính năng **Mở ca (Open Shift)** và **Chốt ca (Close Shift)**.
  * Đầu ca, nhân viên nhập số tiền mặt ban đầu có trong két.
  * Cuối ca, hệ thống tự động tính toán: `Tiền mặt dự kiến = Tiền mặt ban đầu + Doanh thu tiền mặt trong ca`.
  * Nhân viên đếm tiền mặt thực tế trong két và nhập vào hệ thống. Mọi khoản chênh lệch (Thừa/Thiếu tiền) sẽ được ghi nhận lại và gửi báo cáo trực tiếp cho chủ quán (Merchant).

### 3. Đăng nhập nhanh bằng mã PIN hoặc thẻ từ (Quick PIN/RFID Login)
* **Thực trạng:** Nhân viên tại quầy thu ngân thường xuyên phải đổi ca hoặc thao tác thay phiên nhau trên cùng một máy POS. Đăng nhập bằng email và mật khẩu dài dòng vô cùng bất tiện và làm chậm tốc độ phục vụ khách.
* **Giải pháp đề xuất:**
  * Cho phép thiết lập mã PIN ngắn (4-6 số) cho mỗi tài khoản nhân viên.
  * Giao diện POS hiển thị bàn phím số để nhân viên nhập nhanh mã PIN của mình để mở khóa phiên làm việc, hoặc tích hợp đầu đọc thẻ RFID/NFC để nhân viên chỉ cần quét thẻ để đăng nhập tức thì.
