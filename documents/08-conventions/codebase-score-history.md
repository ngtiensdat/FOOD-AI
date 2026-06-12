# Nhật Ký Điểm Số & Chất Lượng Codebase (Codebase Quality Score History)

Tài liệu này dùng để lưu trữ và theo dõi điểm số đánh giá chất lượng mã nguồn (Codebase Review) của dự án FOOD AI qua từng Sprint. Điểm số được đánh giá tự động bằng AI (theo prompt kiểm tra chất lượng) kết hợp với đánh giá thực tế của Mentor.

---

## 1. Tiêu Chí Đánh Giá (Review Criteria)

Chất lượng codebase được chấm trên thang điểm 10 ở 4 khía cạnh chính:
1. **Tính Bảo mật (Security - 2.5đ):** Không hardcode secret/token, phân quyền RBAC chặt chẽ, chống SQL Injection/XSS, bảo mật hostname hình ảnh.
2. **Kiến trúc Hệ thống (Architecture - 2.5đ):** Tuân thủ Clean Architecture, mô hình Controller-Service-Repository tách biệt, áp dụng đúng chuẩn SOLID.
3. **Khả năng Bảo trì & Mở rộng (Maintainability - 2.5đ):** Code dễ đọc, không trùng lặp logic (DRY), cấu trúc thư mục rõ ràng, phân cấp hooks/services tốt.
4. **Độ hoàn thiện (Production Readiness - 2.5đ):** Không có lỗi compile/lint, xử lý lỗi tốt (loading/error states), không bị crash runtime.

---

## 2. Nhật Ký Điểm Số (Score Log)

| Ngày Đánh Giá | Sprint | Người Đánh Giá | Bảo mật (2.5) | Kiến trúc (2.5) | Bảo trì (2.5) | Hoàn thiện (2.5) | **Tổng Điểm** | Ghi Chú |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| 15/05/2026 | **Sprint 2** | AI Auditor | 1.5 | 1.8 | 1.5 | 1.2 | **6.0 / 10** | **Khởi đầu:** Codebase còn trộn lẫn logic trong controller. Next.js image bị wildcard hostname không an toàn. |
| 25/05/2026 | **Sprint 3** | AI Auditor | 2.5 | 2.3 | 2.2 | 2.3 | **9.3 / 10** | **Tiến bộ lớn:** Đã tách Service/Repository. Triển khai component `SafeImage` và khôi phục whitelist hostname bảo mật. Sửa ảnh ShopeeFood HD sắc nét và dọn dẹp link Unsplash hỏng. |
| 03/06/2026 | **Sprint 4** | AI Auditor | 2.25 | 2.3 | 2.35 | 2.25 | **9.18 / 10** | **Ổn định:** Codebase sạch, không có lỗi biên dịch. Đã thêm báo cáo chi tiết cho Sprint 4, phát hiện bypass throttling AI, trực tiếp process.env trong MailService, và một số SRP component lớn. |
| 12/06/2026 | **Sprint 5** | AI Auditor | 2.45 | 2.45 | 2.45 | 2.45 | **9.80 / 10** | **Sát nút hoàn hảo:** Đã khắc phục triệt để lỗ hổng thiếu Helmet, rò rỉ log nhạy cảm ở production, sử dụng SQL an toàn qua $executeRaw, loại bỏ hoàn toàn direct DOM access, thay thế toàn bộ hardcode roles bằng enums, đạt 0 lỗi biên dịch TS. |

---

## 3. Nhật Ký Chi Tiết Sprint 4 (03/06/2026)

### Điểm cộng (Strengths)
- **Đóng gói & Biên dịch hoàn hảo:** Cả FE và BE biên dịch 100% thành công không có bất kỳ lỗi Typescript hay lints nào.
- **Tính năng AI ổn định:** Hybrid search ngữ cảnh địa lý và RAG hoạt động trơn tru. Có distributed locks phân tán sử dụng Redis an toàn.
- **Tập trung hằng số tốt:** Các labels và vị trí địa phương tĩnh đã được cấu hình trong constant file.

### Điểm cần cải thiện tiếp theo (Action Items)
- **Cấu hình rate limits cho AI Chat:** Thêm custom Throttle cho `AiController` thay vì `@SkipThrottle()`.
- **Tách biệt cấu hình SMTP:** Quản lý SMTP credentials thông qua NestJS config tập trung (`appConfig`) thay vì gọi trực tiếp `process.env`.
- **Đồng bộ hóa Clean Architecture & SRP:** Chuyển các câu Prisma update trong `AdminService` vào `FoodRepository` và tách nhỏ component frontend `AiChatWindow.tsx`.

