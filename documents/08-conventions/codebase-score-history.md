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

---

## 3. Nhật Ký Chi Tiết Sprint 3 (25/05/2026)

### Điểm cộng (Strengths)
- **Bảo mật tối đa:** `next.config.ts` đã khôi phục whitelist 4 host an toàn. Sử dụng `SafeImage` chặn lỗi crash và fallback ảnh lỗi sang SVG an toàn.
- **Tối ưu trải nghiệm:** Cắt bỏ bộ lọc resize giúp ảnh món ăn ShopeeFood hiển thị HD sắc nét.
- **Dọn dẹp DB:** Đã xóa sạch 24 link Unsplash hỏng trong DB đưa về `null` giúp terminal hoàn toàn sạch log lỗi 404.

### Điểm cần cải thiện tiếp theo (Action Items)
- **Unit Tests:** Cần bổ sung Unit Tests cho tầng Service của User và Food để nâng điểm kiến trúc và khả năng bảo trì lên tối đa.
- **GraphQL (Tương lai):** Khi mở rộng dữ liệu lớn, cần cân nhắc tích hợp GraphQL theo đúng API Design Standard.
