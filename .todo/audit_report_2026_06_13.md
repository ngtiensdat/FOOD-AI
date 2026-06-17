# Báo Cáo Rà Soát Chất Lượng & Bảo Mật Codebase (AI Code Audit Report)

**Ngày thực hiện:** 13/06/2026  
**Người thực hiện:** Senior AI Security Auditor (10 Years Experience)

---

## 1. Kết Quả Quét Mã Nguồn & Phát Hiện Lỗi

### 🔴 Critical / Nghiêm trọng: Lỗ hổng giả mạo danh tính qua WebSocket (WebSocket Authentication IDOR)
- **Vấn đề:** Trong tập tin [notification.gateway.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/notification/notification.gateway.ts#L50-L57), sự kiện `@SubscribeMessage('register')` hoàn toàn tin cậy vào tham số `userId` (kiểu số) do Client truyền lên:
  ```typescript
  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: number) {
    this.activeConnections.set(Number(userId), client.id);
    ...
  }
  ```
- **Nguyên nhân:** Thiếu lớp xác thực và giải mã token JWT lúc thiết lập kết nối WebSocket (Handshake phase).
- **Nguy cơ bảo mật:** Một kẻ tấn công có thể dễ dàng bắt chước kết nối socket và phát sự kiện `socket.emit('register', targetUserId)` với ID của bất kỳ người dùng nào khác để chặn và nhận trái phép tất cả thông báo thời gian thực của người dùng đó (chứa thông tin like, comment, và các cảnh báo hệ thống).
- **Giải pháp khắc phục:**
  1. Tích hợp một WebSocket Guard hoặc viết một Middleware xác thực cho Socket.io server lúc Handshake để giải mã JWT Token (từ Cookie `accessToken` hoặc Header `Authorization`).
  2. Lấy `userId` trực tiếp từ payload của Token đã được giải mã an toàn, tuyệt đối không nhận tham số `userId` tự do gửi từ phía Client.

---

### 🔴 Critical / Nghiêm trọng: Trùng lặp Logic mạng xã hội (DRY Violation & Code Bloat)
- **Vấn đề:** Logic của các tương tác mạng xã hội (`awardPoints`, `handleCreatePost`, `handleLike`, `handleComment`, `handleShare`, `handleDeleteComment`, `handleReplyComment`, `handleDeleteReply`) vẫn bị lặp lại toàn bộ giữa:
  - [forum/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/forum/page.tsx#L89-L350)
  - [profile/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/profile/page.tsx#L97-L380)
- **Nguyên nhân:** Sự thiếu sót trong việc đóng gói lớp nghiệp vụ ở phía Frontend.
- **Nguy cơ:** Khi thay đổi logic tích lũy điểm kinh nghiệm (XP) hoặc thay đổi tham số gọi API tương tác, lập trình viên sẽ phải sửa song song cả hai file, dễ dẫn đến sai lệch trạng thái dữ liệu (Inconsistent state) giữa trang cá nhân và trang cộng đồng.
- **Giải pháp khắc phục:** 
  - Đóng gói toàn bộ logic tương tác mạng xã hội này vào một Custom Hook chia sẻ (ví dụ: `useSocialActions.ts` đặt trong `frontend/src/hooks/`).

---

### 🟠 Major / Lỗi lớn: Lệch pha cấu hình Module Resolution trong npm Workspaces
- **Vấn đề:** Lỗi biên dịch TypeScript mà chúng ta vừa xử lý:
  `'"@prisma/client"' has no exported member 'BugReport'`
- **Nguyên nhân:** Khi sử dụng npm Workspaces, các gói dependencies (như `@prisma/client`) được tải lên (hoisted) tại thư mục `node_modules` ở gốc dự án. Tuy nhiên, lệnh `prisma generate` mặc định lại ghi đè code vào `node_modules` cục bộ trong thư mục con `my-web/backend/node_modules`, khiến IDE và TS compiler chạy từ gốc bị lỗi lệch pha kiểu dữ liệu.
- **Giải pháp khắc phục:**
  - Định nghĩa rõ đường dẫn đầu ra (output path) trong generator client của [schema.prisma](file:///e:/FOOD_AI_code/my-web/backend/prisma/schema.prisma) hướng thẳng lên root `node_modules` của monorepo:
    ```prisma
    generator client {
      provider = "prisma-client-js"
      output   = "../../../node_modules/@prisma/client"
    }
    ```

---

### 🟡 Minor / Lỗi nhẹ: Hardcode dữ liệu nhãn (Hardcoded Labels)
- **Vấn đề:** Một số chuỗi tiếng Việt vẫn còn đang bị gán cứng (hardcoded) thay vì gọi từ file đa ngôn ngữ `labels.ts`:
  - Trong [BugReportTab.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/profile/BugReportTab.tsx#L100-L105): Giá trị text hiển thị của các thẻ `option` danh mục lỗi.
- **Giải pháp:** Ánh xạ các nhãn hiển thị thông qua bộ từ điển ngôn ngữ `LABELS.BUG_REPORT.CATEGORIES`.

---

## 2. Điểm Số Đánh Giá Chất Lượng (Codebase Scoring)

Dựa trên tiêu chuẩn Clean Code, SOLID và quy chuẩn đánh giá của dự án, điểm số chất lượng được ghi nhận như sau:

| Tiêu Chí | Điểm Số | Nhận Xét |
| :--- | :---: | :--- |
| **Tính Bảo mật (Security)** | **1.8 / 2.5** | Tốt ở lớp Auth Guards và IDOR REST APIs, nhưng bị trừ điểm nặng do kẽ hở giả mạo ID người dùng qua WebSocket. |
| **Kiến trúc Hệ thống (Architecture)** | **2.0 / 2.5** | Tổ chức folder phân cấp rất sáng sủa. Tuy nhiên, việc copy-paste code ở Frontend (Forum và Profile) làm giảm điểm số Clean Architecture. |
| **Khả năng Bảo trì & Mở rộng (Maintainability)** | **2.2 / 2.5** | Đa ngôn ngữ (i18n) ở backend và frontend tốt, cấu hình Typescript chuẩn `isolatedModules`. |
| **Độ hoàn thiện (Production Readiness)** | **2.3 / 2.5** | Code biên dịch rất sạch, không còn lỗi compile, SafeImage xử lý fallback ảnh bị lỗi tốt. |
| **TỔNG ĐIỂM** | **8.3 / 10** | **Xếp loại: Khá/Tốt (Senior Software Engineer Grade)**. Cần ưu tiên vá lỗ hổng bảo mật socket và DRY frontend ngay. |

---

## 3. Đề Xuất Nâng Cấp (Action Items)

1. **Vá lỗ hổng bảo mật WebSocket:**
   - Cấu hình Middleware trên Socket.io Server của NestJS để tự động xác thực JWT Token gửi kèm lúc kết nối (handshake) và gán `client.data.userId = decoded.id`. Xoá bỏ tham số `userId` thủ công khỏi sự kiện `register`.
2. **Refactor mã nguồn Frontend:**
   - Tạo custom hook `useSocialActions.ts` dùng chung cho `ForumPage` và `ProfilePage` để tối ưu hoá mã nguồn và loại bỏ DRY violation.
3. **Cấu hình Output generator của Prisma:**
   - Điều chỉnh cấu hình `output` trong `schema.prisma` trỏ thẳng lên root `node_modules` để việc cập nhật database ở local backend tự động đồng bộ hóa types với IDE.
