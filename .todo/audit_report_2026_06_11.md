# Báo Cáo Rà Soát Chất Lượng & Bảo Mật Codebase (AI Code Audit Report)
**Ngày thực hiện:** 11/06/2026  
**Người thực hiện:** Senior AI Auditor

---

## 1. Kết Quả Quét Mã Nguồn & Phát Hiện Lỗi

### 🔴 Critical / Nghiêm trọng: Logic Duplication & DRY Violation
- **Vấn đề:** Trùng lặp hoàn toàn logic xử lý mạng xã hội (`awardPoints`, `handleCreatePost`, `handleLike`, `handleComment`, `handleShare`, `handleDeleteComment`, `handleReplyComment`, `handleDeleteReply`) giữa hai trang [forum/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/forum/page.tsx#L104-L473) và [profile/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/profile/page.tsx#L151-L529).
- **Nguyên nhân:** Logic được copy-paste thủ công giữa hai trang thay vì được đóng gói vào một Custom Hook hoặc Service tập trung.
- **Giải pháp:** Tách toàn bộ logic này ra một custom hook chia sẻ (ví dụ `useSocialActions`) để tái sử dụng và đảm bảo tính đồng bộ dữ liệu.

### 🟠 Major / Lỗi lớn: Hardcode & Thiếu Localization (i18n)
- **Vấn đề:** Hàng chục chuỗi hiển thị tiếng Việt vẫn đang bị hardcode trực tiếp vào JSX của nhiều file:
  - [Navbar.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/Navbar.tsx#L229-L239): Tiêu đề và nút "Thông báo", "Đã đọc tất cả", "Xóa hết", "Bạn chưa có thông báo nào".
  - [AdminNotificationTab.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/admin/AdminNotificationTab.tsx#L31-L88): Form tiêu đề, nút "Gửi thông báo", "Tất cả thành viên", "Thành viên cụ thể".
  - [OffersSection.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/offers/OffersSection.tsx#L36-L70): Seed data và labels của tab khuyến mại.
  - [ProfileSettingsTab.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/profile/ProfileSettingsTab.tsx#L32-L41): Danh sách nhãn và mô tả `PRIVACY_FIELDS`.
  - [VoucherMallTab.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/profile/VoucherMallTab.tsx#L31-L72): Danh sách tĩnh `AVAILABLE_VOUCHERS`.
- **Nguyên nhân:** Lớp trình bày chưa được quốc tế hóa triệt để qua `LABELS`.
- **Giải pháp:** Di chuyển toàn bộ các hằng số và danh sách dữ liệu tĩnh này vào `labels.ts` và `labels.en.ts`.

### 🟡 Minor / Lỗi nhẹ: Magic Values trong Charts & CSS
- **Vấn đề:** Các magic numbers layout biểu đồ (x, y coordinates offset) trong [DoubleBarChart.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/restaurant/analytics/DoubleBarChart.tsx#L190-L206) như `x - 55`, `y - 32` chưa được khai báo thành hằng số rõ ràng.
- **Giải pháp:** Đặt các giá trị này thành hằng số tĩnh ở đầu file biểu đồ để dễ điều chỉnh giao diện.

---

## 2. Điểm Số Đánh Giá Chất Lượng (Codebase Scoring)

Dựa trên các tiêu chuẩn chất lượng dự án, điểm số chi tiết như sau:

| Tiêu Chí | Điểm Số | Nhận Xét |
| :--- | :---: | :--- |
| **Tính Bảo mật (Security)** | **2.3 / 2.5** | whitelist hostname Next.js và Auth Guards/RBAC ở Backend rất chặt chẽ, chống IDOR an toàn. |
| **Kiến trúc Hệ thống (Architecture)** | **2.3 / 2.5** | Phân cấp Controller-Service-Repository tốt. Tuy nhiên còn DRY violation lớn ở Social module. |
| **Khả năng Bảo trì & Mở rộng (Maintainability)** | **2.1 / 2.5** | Quá nhiều chuỗi tiếng Việt bị hardcode làm cản trở việc hỗ trợ đa ngôn ngữ (Localization). |
| **Độ hoàn thiện (Production Readiness)** | **2.4 / 2.5** | Không có lỗi compile/lint, SafeImage có fallback load ảnh bị lỗi rất tốt. |
| **TỔNG ĐIỂM** | **9.1 / 10** | **Xếp loại: Xuất sắc (Staff Engineer Grade)**, tuy nhiên cần dọn dẹp hardcode và logic duplication ngay. |

---

## 3. Đề Xuất Nâng Cấp (Action Items)

1. **Localize 100% UI strings:** Di chuyển tất cả chuỗi và config tĩnh (vouchers, privacy fields, seed offers, notifications) từ file `.tsx` sang `labels.ts` / `labels.en.ts`.
2. **Refactor Social logic:** Tạo custom hook `useSocialActions.ts` đóng gói toàn bộ logic tương tác xã hội (like, comment, share, points) để dùng chung cho `ForumPage` và `ProfilePage`.
3. **Chart Constants:** Khai báo hằng số cho các kích thước offset của biểu đồ SVGs.
