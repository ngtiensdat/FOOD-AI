# Engineering Tasks - Sprint 7

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 7.

## 1. Localization & Community Moderation

### [Backend]
- [x] Task 1.1: Thiết lập thư viện đa ngôn ngữ trên Backend (i18n) để trả về thông báo lỗi chuẩn hóa theo ngôn ngữ yêu cầu.
- [x] Task 1.2: Thiết kế schema Database cho Report (Báo cáo vi phạm).
- [x] Task 1.3: API tạo yêu cầu Báo cáo vi phạm cho Bài viết/Bình luận.
- [x] Task 1.4: API Admin Moderation: Danh sách hàng đợi duyệt báo cáo, xử lý gỡ nội dung hoặc cảnh cáo tài khoản vi phạm.

### [Frontend]
- [x] Task 1.5: Cấu hình đa ngôn ngữ phía Client (ví dụ: next-intl hoặc react-i18next).
- [x] Task 1.6: Tạo bộ từ điển tiếng Anh/Việt (en.json, vi.json) cho toàn bộ UI text.
- [x] Task 1.7: UI chọn ngôn ngữ trên Navbar.
- [x] Task 1.8: UI Modal báo cáo vi phạm và Admin Panel duyệt báo cáo vi phạm.

---

## 2. Analytics & Technical Support

### [Backend]
- [x] Task 2.1: API thu thập và tổng hợp số liệu thống kê lượt xem món ăn (trackView data aggregation).
- [x] Task 2.2: API tổng hợp lượt click / gợi ý AI của Merchant.
- [x] Task 2.3: API kết nối OpenAI để tạo AI Insights (phân tích xu hướng ẩm thực cho chủ nhà hàng).
- [x] Task 2.4: API nhận yêu cầu báo lỗi kỹ thuật (gửi mail hoặc lưu database để nhà phát triển xem).

### [Frontend]
- [x] Task 2.5: Tích hợp thư viện biểu đồ (ví dụ: Recharts hoặc Chart.js) hiển thị số liệu thống kê trong Merchant Dashboard.
- [x] Task 2.6: Panel hiển thị AI Insights (Đề xuất tự động từ AI cho Merchant).
- [x] Task 2.7: UI Form báo cáo lỗi kỹ thuật và đóng góp ý kiến.

---

## 3. Enhancements, Resiliency & Observability (Bổ sung thêm)

### [Frontend]
- [x] Task 3.1: Component Mascot Chibi với các trạng thái biểu cảm động (xin chào, thả tim, nháy mắt, chúc mừng, hỗ trợ viên, lưu ý, thắc mắc, trải nghiệm).
- [x] Task 3.2: Menu Assistive Touch (AssistiveTouchMenu) truy cập nhanh các chức năng chính (Trang chủ, Gợi ý AI, Báo lỗi, Cuộn lên đầu).
- [x] Task 3.3: Các trang thông tin tĩnh: Điều khoản dịch vụ (`/terms`), Chính sách bảo mật (`/policy`), Trang liên hệ (`/contact`).

### [Backend]
- [x] Task 3.4: Tích hợp Redis Caching toàn cục & cơ chế tự động hủy cache (Cache Invalidation Interceptor).
- [x] Task 3.5: Cơ chế phục hồi lỗi tự động: Circuit Breaker, Retry Helper, Retry Queue Service cho các dịch vụ gọi API ngoài (OpenAI, Weather).
- [x] Task 3.6: Giám sát chi phí API OpenAI với Budget Tracker Service và hệ thống Structured Logger.
- [x] Task 3.7: Thiết lập Ready/Live Probes để phục vụ giám sát sức khỏe dịch vụ.
- [x] Task 3.8: Viết bộ E2E Integration Tests kiểm thử toàn bộ luồng chat và gợi ý của AI (`ai.e2e-spec.ts`).

