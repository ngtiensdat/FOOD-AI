# Báo cáo Rà soát Chất lượng & Bảo mật Codebase (AI Code Audit Report)
**Ngày tạo:** 03-06-2026  
**Trạng thái:** HOÀN THÀNH (Đã kiểm tra toàn bộ codebase)  
**Nhánh Git:** `feature/AI-Chat-Intelligence-and-recommendation-flow`

---

## 1. Danh sách các vấn đề phát hiện (Audit Issues)

Dưới đây là danh sách các vấn đề được phát hiện trong đợt rà soát chất lượng và bảo mật mã nguồn ngày 03-06-2026, phân loại theo mức độ nghiêm trọng:

### 1.1. Bỏ qua cơ chế giới hạn tần suất API (Throttling Config Bypass)
* **Tên file**: [ai.controller.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/ai/ai.controller.ts)
* **Vị trí**: Dòng 25 (decorator `@SkipThrottle()`)
* **Mức độ nghiêm trọng**: **Trung bình (Medium)**
* **Nguyên nhân**: Sử dụng `@SkipThrottle()` ở cấp độ Class vô hiệu hóa hoàn toàn cơ chế chống spam (rate limiting) cho các API chat AI. Dù đã có `JwtAuthGuard` bảo vệ, việc không giới hạn tần suất gửi tin nhắn chat AI có thể khiến hệ thống dễ bị tấn công từ chối dịch vụ (DoS) hoặc bị khách hàng spam liên tục, gây tăng chi phí sử dụng OpenAI API (GPT/Embedding) ngoài tầm kiểm soát.
* **Giải pháp đề xuất**: Thay vì bỏ qua hoàn toàn, hãy sử dụng cơ chế giới hạn tần suất riêng (Custom Throttle) cho đàm thoại AI (ví dụ: giới hạn 30 lượt truy cập trong 1 phút).
  ```typescript
  // Giải pháp đề xuất: Thay thế @SkipThrottle() bằng cấu hình Throttle cụ thể
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  ```

---

### 1.2. Truy cập trực tiếp biến môi trường nhạy cảm trong Service (Environment Abstraction Bypass)
* **Tên file**: [mail.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/mail/mail.service.ts)
* **Vị trí**: Dòng 18-22, 32, 36
* **Mức độ nghiêm trọng**: **Trung bình (Medium)**
* **Nguyên nhân**: `MailService` truy cập trực tiếp các biến môi trường thông qua `process.env.MAIL_HOST`, `process.env.MAIL_PORT`, v.v., thay vì đi qua NestJS `ConfigService` hoặc sử dụng wrapper `appConfig` tập trung như các module khác. Điều này vi phạm nguyên lý bảo mật và quản lý cấu hình hệ thống tập trung.
* **Giải pháp đề xuất**: Di chuyển các cấu hình SMTP này vào file cấu hình tập trung [app.config.ts](file:///e:/FOOD_AI_code/my-web/backend/src/config/app.config.ts) và sử dụng hàm `appConfig()` để truy xuất.

---

### 1.3. Vi phạm kiến trúc phân lớp Clean Architecture (Direct Prisma Usage in Service)
* **Tên file**: [admin.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/admin/admin.service.ts)
* **Vị trí**: Dòng 104 (`toggleWeeklyFeatured`), Dòng 118 (`batchUpdateFoods`)
* **Mức độ nghiêm trọng**: **Thấp (Low)**
* **Nguyên nhân**: `AdminService` gọi trực tiếp `this.prisma.food.update` để cập nhật dữ liệu database thay vì gọi qua `FoodRepository`. Điều này vi phạm nguyên tắc tách biệt mối quan tâm (Separation of Concerns) trong Clean Architecture, khi tầng Service tự động bỏ qua tầng Repository để tương tác trực tiếp với Database client.
* **Giải pháp đề xuất**: Chuyển các câu lệnh cập nhật Prisma này vào `FoodRepository` và gọi các hàm tương ứng từ `AdminService`.

---

### 1.4. Sử dụng chuỗi thô thay thế cho Enum (Magic String Enum Violation)
* **Tên file**: [user.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/user/user.service.ts)
* **Vị trí**: Dòng 98 (`if (user.role === 'RESTAURANT')`)
* **Mức độ nghiêm trọng**: **Thấp (Low)**
* **Nguyên nhân**: So sánh giá trị role của người dùng bằng một chuỗi thô `'RESTAURANT'` thay vì sử dụng Enum `UserRole.RESTAURANT` được cung cấp từ `@prisma/client`. Điều này làm giảm tính an toàn kiểu dữ liệu (Type safety) và tăng nguy cơ lỗi chính tả khi bảo trì.
* **Giải pháp đề xuất**: Thay thế bằng enum chuẩn:
  ```typescript
  import { UserRole } from '@prisma/client';
  // ...
  if (user.role === UserRole.RESTAURANT) {
  ```

---

### 1.5. Thiếu cơ chế Fallback xử lý lỗi hiển thị hình ảnh (Lack of Image Error Fallback)
* **Tên file**: [Hero.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/Hero.tsx)
* **Vị trí**: Dòng 61 (ảnh nền `heroBg`), Dòng 114 (logo thương hiệu `/logo.png`)
* **Mức độ nghiêm trọng**: **Thấp (Low)**
* **Nguyên nhân**: Sử dụng trực tiếp component `Image` của Next.js mà không thông qua component bảo vệ `SafeImage` và không thiết lập thuộc tính `onError`. Nếu ảnh local bị mất hoặc gặp lỗi đường dẫn, giao diện có thể gặp cảnh báo và không có ảnh thay thế (fallback).
* **Giải pháp đề xuất**: Chuyển sang sử dụng component `SafeImage` hoặc cung cấp hàm `onError` cho các thẻ ảnh này.

---

### 1.6. Component quá lớn vi phạm Nguyên lý Đơn trách nhiệm (Single Responsibility Principle)
* **Tên file**: [AiChatWindow.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/ai/AiChatWindow.tsx)
* **Vị trí**: Toàn bộ tệp tin (464 dòng)
* **Mức độ nghiêm trọng**: **Thấp (Low)**
* **Nguyên nhân**: Mặc dù logic chat phức tạp đã được đưa vào custom hook `useAiChat`, component `AiChatWindow` vẫn phải cáng đáng render quá nhiều phần UI độc lập bao gồm Sidebar, Chat Feed, Drawer giả lập và Input Form, khiến tệp tin trở nên cồng kềnh.
* **Giải pháp đề xuất**: Tách component này thành các presentational subcomponents nhỏ hơn: `ChatSidebar.tsx`, `ChatFeed.tsx`, `ChatConfigDrawer.tsx` và `ChatInputForm.tsx` trong thư mục `src/components/features/ai/components/`.

---

## 2. Điểm số chất lượng Codebase hiện tại (Codebase Scoring)

Dựa theo tiêu chí đánh giá tiêu chuẩn của dự án FOOD-AI, dưới đây là điểm số đánh giá chất lượng mã nguồn hiện tại trên thang điểm 10:

| Tiêu chí | Điểm số | Nhận xét chi tiết |
| :--- | :---: | :--- |
| **Tính Bảo mật (Security)** | **9.0 / 10** | **Rất tốt.** Dự án áp dụng tốt parameterization cho SQL Raw giúp loại bỏ SQL Injection. Các API nhạy cảm được bảo vệ tốt bằng Guards. Cần cấu hình custom rate limits cho AI Chat và đưa thông tin SMTP vào file config tập trung để đạt điểm tối đa. |
| **Kiến trúc (Architecture)** | **9.3 / 10** | **Tốt.** Hệ thống được phân lớp rõ ràng. Tuy nhiên, việc gọi trực tiếp `PrismaService` từ `AdminService` cần được đưa về Repository để bảo đảm tính thống nhất và sạch sẽ của Clean Architecture. |
| **Khả năng Bảo trì & Mở rộng (Maintainability)** | **9.4 / 10** | **Tốt.** Hầu hết các magic values và labels đã được tách thành hằng số tập trung. Cần dọn dẹp các magic string literals cho Enum và phân rã các component lớn như `AiChatWindow.tsx`. |
| **Độ hoàn thiện (Production Readiness)** | **9.0 / 10** | **Cao.** Cả Frontend và Backend đều biên dịch và đóng gói (build) thành công 100%. Trải nghiệm người dùng mượt mà, chỉ cần bổ sung fallback an toàn cho các thẻ ảnh tại component Hero. |

**ĐIỂM TRUNG BÌNH CHUNG: 9.18 / 10** - Đạt chuẩn sản xuất cấp cao (High-Level Production Ready).

---

## 3. Các đề xuất cải tiến tiếp theo (Action Items)

1. **Thiết lập Custom Throttle cho AI Chat**: Thay thế `@SkipThrottle()` bằng `@Throttle({ default: { limit: 30, ttl: 60000 } })` trong `AiController`.
2. **Quản lý cấu hình SMTP tập trung**: Chuyển các thông số `MAIL_` sang `appConfig` và đưa vào `MailService` thông qua cơ chế config.
3. **Chuyển query Prisma về Repository**: Chuyển các thao tác DB của `AdminService` vào `FoodRepository`.
4. **Chuẩn hóa Enum**: Thay thế `'RESTAURANT'` bằng `UserRole.RESTAURANT` trong `UserService`.
5. **Phân rã component UI**: Tách nhỏ `AiChatWindow.tsx` thành các presentational subcomponents độc lập.
6. **Sử dụng SafeImage tại Hero**: Thay thế hoặc bổ sung fallback `onError` cho các thẻ ảnh trong `Hero.tsx`.
