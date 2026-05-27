# Báo Cáo Rà Soát (Audit Report) - Backend FOOD AI
*Ngày tạo: 27/05/2026*

## 1. Danh sách các vấn đề phát hiện

### Mức độ: Trung bình (Medium)
1. **Hardcode CORS Origin trong `main.ts`**
   - **File:** `backend/src/main.ts` (Dòng 40)
   - **Vấn đề:** Origin đang được set cứng là `[config.frontendUrl, 'http://127.0.0.1:3000']`. Trên môi trường production, địa chỉ `127.0.0.1:3000` không nên được cho phép (allow) một cách mặc định.
   - **Giải pháp:** Xóa hardcode và đưa hoàn toàn danh sách allow origin vào biến môi trường `FRONTEND_URL` (có thể phân tách bằng dấu phẩy nếu có nhiều domain).

2. **Hệ thống Logging chưa đạt chuẩn Production**
   - **File:** `backend/src/main.ts` (Dòng 35)
   - **Vấn đề:** Ứng dụng đang dùng `console.log` thuần để ghi log Request thay vì sử dụng thư viện logging chuẩn (như `Winston` hoặc `Pino`). Việc này gây khó khăn trong quá trình truy vết (trace) lỗi trên Server, không phân rã được Log Level (Info/Warn/Error).
   - **Giải pháp:** Tích hợp `NestJS Logger` hoặc `Winston`.

### Mức độ: Thấp (Low) / Thông tin
1. **Xử lý Prisma Raw Query với kiểu Vector**
   - **File:** `backend/src/modules/ai/vector.repository.ts`
   - **Vấn đề:** Hiện tại `vectorStr` được build thủ công bằng `[${vector.join(',')}]` và đưa vào raw query. Vì `vector` là mảng số nguyên nên hiện tại hoàn toàn **an toàn** (không có SQL Injection). Tuy nhiên, về mặt kỹ thuật, Prisma hỗ trợ gán tham số an toàn hơn.
   - **Giải pháp:** Tạm thời giữ nguyên vì vẫn an toàn, nhưng cần lưu ý nếu thay đổi kiểu dữ liệu đầu vào.

2. **Dư thừa Secret fallback cho Dev**
   - **File:** `backend/src/config/app.config.ts`
   - **Vấn đề:** Có fallback `'super-secret-key-for-dev-only'` nếu không có biến môi trường. Mặc dù đã chặn bằng cách throw error ở chế độ production, nhưng vẫn tồn tại rủi ro nhỏ nếu vô tình set sai `NODE_ENV`.

---

## 2. Điểm số chất lượng codebase (8.5/10)

- **Tính Bảo mật (Security) [8.5/10]:** Rất tốt! Các kỹ thuật chống **IDOR** được triển khai bài bản (ví dụ ở `food.service.ts` - kiểm tra quyền sở hữu món ăn trước khi sửa/xóa). Validation Pipe được thiết lập chặt chẽ (`whitelist: true`, `forbidNonWhitelisted: true`) để chống Mass Assignment.
- **Kiến trúc Clean Architecture [9/10]:** Xuất sắc! Phân chia lớp rõ ràng: Controllers (nhận Request), Services (xử lý logic), Repositories (tương tác DB). Sử dụng Constants cho `MESSAGES` và `LIMITS` giúp code rất sạch.
- **Khả năng mở rộng & Bảo trì [8/10]:** Hệ thống dùng DTO và Typings rõ ràng. Cấu trúc module NestJS chia theo feature (`user`, `food`, `admin`, `ai`) rất dễ mở rộng.
- **Độ hoàn thiện & Trơn tru (Production Readiness) [8/10]:** Tốt. Đã có Exception Filters tổng quát và cấu hình Throttler (rate limiting). Cần hoàn thiện hệ thống Logging và Unit Tests để đạt 10/10.

---

## 3. Điểm mạnh và Điểm yếu lớn nhất

- **Điểm mạnh lớn nhất:** Tư duy bảo mật và cấu trúc (Architecture). Các hàm kiểm tra quyền sở hữu (ownership) và phân quyền (RolesGuard) được áp dụng nhất quán.
- **Điểm yếu lớn nhất:** Thiếu hệ thống Logging chuyên nghiệp. Khi đưa lên Production sẽ rất khó Debug nếu chỉ phụ thuộc vào `console.log`.
- **Technical Debt nguy hiểm nhất:** Nếu module AI bị gọi liên tục (DDoS/Spam), chưa thấy rõ cơ chế Rate Limiting áp dụng triệt để cho route `/ai/chat` (vì query vector embedding khá tốn tài nguyên DB).

---

## 4. Đề xuất nâng cấp (Action Items)

1. Tích hợp thư viện Logging như `Pino` hoặc `Winston` thay cho `console.log`.
2. Kiểm tra lại và gỡ bỏ hardcode `'http://127.0.0.1:3000'` trong cấu hình CORS ở `main.ts`.
3. Bổ sung Rate Limiting (`@SkipThrottle(false)`) chặt chẽ hơn vào Controller AI (`ai.controller.ts`).
4. Triển khai Unit Tests (ít nhất cho các Service quan trọng như `auth.service.ts` và `food.service.ts`) vì hiện tại thư mục `test` chưa thấy được sử dụng triệt để.
