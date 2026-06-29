# User Stories - Sprint 7

**Mục tiêu Sprint:** Hoàn thiện và tối ưu hóa hệ thống thông qua việc tích hợp đa ngôn ngữ, hệ thống kiểm duyệt và báo cáo vi phạm, cung cấp biểu đồ thống kê cho Merchant và form báo cáo lỗi kỹ thuật.

---

## 1. Localization & Community Moderation (Đa ngôn ngữ & Kiểm duyệt)

### US-25: Hỗ trợ đa ngôn ngữ (Localization)
- **As a** người dùng hệ thống
- **I want** có thể chuyển đổi giao diện giữa Tiếng Việt và Tiếng Anh
- **So that** tôi có thể dễ dàng sử dụng ứng dụng theo ngôn ngữ phù hợp nhất với bản thân.

**Acceptance Criteria (AC):**
- [x] Nút chuyển đổi ngôn ngữ (VI/EN) nằm trên Navbar chính.
- [x] Dịch toàn bộ các nhãn (labels), tiêu đề, nút bấm và thông báo lỗi sang hai ngôn ngữ.
- [x] Lưu lựa chọn ngôn ngữ của người dùng vào Session/Database để áp dụng cho những lần truy cập sau.

### US-26: Báo cáo nội dung vi phạm (Report System)
- **As a** thành viên cộng đồng có trách nhiệm
- **I want** báo cáo các bài viết review hoặc bình luận không lành mạnh, sai sự thật
- **So that** giúp Admin gỡ bỏ nội dung rác và duy trì môi trường MXH ẩm thực an toàn, lành mạnh.

**Acceptance Criteria (AC):**
- [x] Nút "Báo cáo" (Report) hiển thị trên mọi bài viết và bình luận của người khác.
- [x] Form báo cáo cho phép chọn lý do (Spam, Ngôn từ kích động, Thông tin sai lệch, Khác...).
- [x] Gửi yêu cầu báo cáo về hệ thống hàng đợi phê duyệt (Moderation Queue) của Admin.

---

## 2. Analytics & Technical Support (Thống kê & Trợ giúp kỹ thuật)

### US-27: Thống kê hiệu quả kinh doanh và Insight AI (Merchant Analytics)
- **As a** chủ nhà hàng (Merchant)
- **I want** xem các chỉ số thống kê về lượt xem món ăn, lượt tương tác và số lượng khách hàng tiếp cận qua gợi ý của AI
- **So that** tôi hiểu rõ hiệu quả kinh doanh và tối ưu hóa thực đơn của mình.

**Acceptance Criteria (AC):**
- [x] Biểu đồ thống kê lượt xem món ăn theo ngày/tuần/tháng trên Dashboard.
- [x] Thống kê số lần món ăn của quán xuất hiện trong gợi ý của AI.
- [x] AI phân tích ngắn gọn đề xuất: Món nào đang hot, món nào cần giảm giá hoặc cải thiện chất lượng.

### US-28: Báo lỗi kỹ thuật & Đóng góp ý kiến (Bug Report)
- **As a** người dùng gặp sự cố kỹ thuật
- **I want** gửi phản hồi lỗi trực tiếp kèm ảnh chụp màn hình cho nhà phát triển
- **So that** sự cố được xử lý nhanh chóng, cải thiện chất lượng ứng dụng.

**Acceptance Criteria (AC):**
- [x] Form báo lỗi kỹ thuật tại trang Trợ giúp / FAQ.
- [x] Cho phép điền mô tả lỗi, chọn danh mục (Đăng nhập, Đặt món, Bản đồ...) và tải lên ảnh minh họa.

### US-28+: Nâng cao độ tin cậy và hiệu năng hệ thống (Operations Hardening)
- **As a** kỹ sư vận hành hệ thống
- **I want** ứng dụng được tích hợp cache, quản lý hàng đợi lỗi tự động, bộ giám sát chi phí API AI và các cổng tự kiểm tra sức khỏe
- **So that** hệ thống vận hành bền vững, chịu tải tốt và kiểm soát tốt ngân sách API.

**Acceptance Criteria (AC):**
- [x] Tích hợp Redis Cache tăng tốc độ đọc dữ liệu tĩnh (như danh sách bài đăng).
- [x] Tích hợp hàng đợi Retry queue xử lý lại tự động các tác vụ nền bị lỗi (như đồng bộ vector).
- [x] Tích hợp Budget tracker giám sát chặt chẽ lượng token sử dụng của OpenAI để tránh cạn kiệt tài khoản.
- [x] Triển khai cổng Health check endpoint phục vụ monitor tình trạng DB, Redis, Server.

