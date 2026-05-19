# User Stories - Sprint 8 (Advanced Security & Engagement Optimization)

**Mục tiêu Sprint:** Tăng cường tối đa tính an toàn của hệ thống chống các lỗ hổng web phổ biến, cải thiện trải nghiệm tương tác với nút chia sẻ bài viết, và bổ sung chức năng kiểm soát gợi ý thông minh từ AI.

---

## 1. Advanced Security & Platform Integrity (Bảo mật nâng cao & Toàn vẹn hệ thống)

### US-29: Ngăn chặn các lỗ hổng bảo mật web phổ biến (Security Hardening)
- **As a** quản trị viên hệ thống
- **I want** hệ thống được cấu hình bảo mật chống các cuộc tấn công SQL Injection, XSS và CSRF
- **So that** dữ liệu của người dùng được an toàn và ứng dụng tránh bị khai thác lỗi bảo mật.

**Acceptance Criteria (AC):**
- [ ] Cấu hình **Helmet middleware** bảo vệ ứng dụng NestJS khỏi các lỗ hổng HTTP headers phổ biến.
- [ ] Cấu hình cơ chế bảo mật **CSRF protection** (hoặc Double Submit Cookie) đối với các request thay đổi trạng thái (POST, PUT, DELETE) do hệ thống sử dụng HttpOnly Cookie.
- [ ] Áp dụng **Class-validator** và **Sanitization Pipe** ở Backend để tự động lọc sạch và loại bỏ các thẻ HTML độc hại trong dữ liệu nhập vào (chống XSS).
- [ ] Đảm bảo Prisma ORM luôn sử dụng parameterized queries để ngăn chặn hoàn toàn SQL Injection.

---

## 2. Advanced AI & Engagement (Trải nghiệm tương tác & Tối ưu gợi ý AI)

### US-30: Làm mới (Refresh) danh sách gợi ý từ AI
- **As a** thực khách đang tìm món ăn
- **I want** làm mới danh sách món ăn gợi ý từ trợ lý AI khi chưa tìm thấy món ưng ý
- **So that** tôi có thêm các lựa chọn ăn uống đa dạng mà không bị trùng lặp với gợi ý trước.

**Acceptance Criteria (AC):**
- [ ] UI nút bấm "Làm mới gợi ý" (Refresh Suggestions) ở phần Hero/AI suggestion.
- [ ] API cập nhật tham số offset/seed để tính toán lại danh sách gợi ý mới từ Vector DB mà không trùng lặp các món đã hiển thị.
- [ ] Hiệu ứng loading mượt mà (Skeleton/Spinner) khi AI đang tạo danh sách gợi ý mới.

### US-31: Chia sẻ món ăn và Bài viết qua Mạng xã hội bên ngoài (Social Sharing)
- **As a** thành viên cộng đồng ẩm thực
- **I want** chia sẻ món ăn ngon hoặc một bài viết review tâm đắc lên Facebook, Zalo hoặc copy liên kết nhanh
- **So that** bạn bè ngoài nền tảng của tôi cũng có thể xem và tham khảo.

**Acceptance Criteria (AC):**
- [ ] UI Nút bấm "Chia sẻ" (Share) trên mỗi Food Card và Post Card.
- [ ] Tích hợp Web Share API của trình duyệt (trên thiết bị di động) để chia sẻ trực tiếp.
- [ ] Menu lựa chọn: Chia sẻ qua Facebook, Chia sẻ qua Zalo, Sao chép liên kết (Copy Link) hiển thị thông báo toast thành công.
- [ ] Hỗ trợ Open Graph meta tags (OG tags) đầy đủ để khi chia sẻ link lên Facebook/Zalo sẽ hiển thị ảnh đại diện món ăn, tên món ăn và mô tả sinh động.
