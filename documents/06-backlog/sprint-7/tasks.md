# Engineering Tasks - Sprint 7

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 7.

## 1. Localization & Community Moderation

### [Backend]
- [ ] Task 1.1: Thiết lập thư viện đa ngôn ngữ trên Backend (i18n) để trả về thông báo lỗi chuẩn hóa theo ngôn ngữ yêu cầu.
- [ ] Task 1.2: Thiết kế schema Database cho Report (Báo cáo vi phạm).
- [ ] Task 1.3: API tạo yêu cầu Báo cáo vi phạm cho Bài viết/Bình luận.
- [ ] Task 1.4: API Admin Moderation: Danh sách hàng đợi duyệt báo cáo, xử lý gỡ nội dung hoặc cảnh cáo tài khoản vi phạm.

### [Frontend]
- [ ] Task 1.5: Cấu hình đa ngôn ngữ phía Client (ví dụ: next-intl hoặc react-i18next).
- [ ] Task 1.6: Tạo bộ từ điển tiếng Anh/Việt (en.json, vi.json) cho toàn bộ UI text.
- [ ] Task 1.7: UI Dropdown chọn ngôn ngữ trên Navbar.
- [ ] Task 1.8: UI Modal báo cáo vi phạm và Admin Panel duyệt báo cáo vi phạm.

---

## 2. Analytics & Technical Support

### [Backend]
- [ ] Task 2.1: API thu thập và tổng hợp số liệu thống kê lượt xem món ăn (trackView data aggregation).
- [ ] Task 2.2: API tổng hợp lượt click / gợi ý AI của Merchant.
- [ ] Task 2.3: API kết nối OpenAI để tạo AI Insights (phân tích xu hướng ẩm thực cho chủ nhà hàng).
- [ ] Task 2.4: API nhận yêu cầu báo lỗi kỹ thuật (gửi mail hoặc lưu database để nhà phát triển xem).

### [Frontend]
- [ ] Task 2.5: Tích hợp thư viện biểu đồ (ví dụ: Recharts hoặc Chart.js) hiển thị số liệu thống kê trong Merchant Dashboard.
- [ ] Task 2.6: Panel hiển thị AI Insights (Đề xuất tự động từ AI cho Merchant).
- [ ] Task 2.7: UI Form báo cáo lỗi kỹ thuật và đóng góp ý kiến.
