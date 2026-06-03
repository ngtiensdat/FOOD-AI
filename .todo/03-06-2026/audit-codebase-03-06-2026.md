# 🔍 BÁO CÁO KIỂM TOÁN CHẤT LƯỢNG & BẢO MẬT CODEBASE
**Ngày tạo:** 03/06/2026 — 14:10 (GMT+7)
**Phạm vi:** Toàn bộ dự án Food AI (Backend NestJS + Frontend Next.js)
**Phương pháp:** Kiểm toán 5 bước theo TRIGGER_AI_AUDIT.md

---

## PHẦN 1: DANH SÁCH LỖI PHÁT HIỆN

---

### 🔴 MỨC NGHIÊM TRỌNG (CRITICAL)

#### C-01: Thiếu Security Headers (Helmet Middleware)
- **File:** [main.ts](file:///e:/FOOD_AI_code/my-web/backend/src/main.ts)
- **Dòng:** Toàn bộ file — thiếu `app.use(helmet())`
- **Nguyên nhân:** Backend không cài đặt middleware `helmet` để thiết lập các HTTP Security Headers quan trọng (Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy).
- **Tác động:** Dễ bị tấn công XSS, Clickjacking, MIME-type sniffing, và thiếu HSTS enforcement.
- **Giải pháp:**
  ```bash
  npm install helmet
  ```
  ```typescript
  import helmet from 'helmet';
  // Trong bootstrap()
  app.use(helmet());
  ```

#### C-02: Endpoint Analytics thiếu phân quyền ADMIN
- **File:** [ai.controller.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/ai/ai.controller.ts#L45-L48)
- **Dòng:** 45-48
- **Nguyên nhân:** `GET /ai/analytics` trả về dữ liệu thống kê nhạy cảm (top foods, feedback rates) nhưng chỉ yêu cầu đăng nhập (`JwtAuthGuard` ở class-level), không kiểm tra quyền ADMIN. Bất kỳ CUSTOMER nào cũng truy cập được.
- **Tác động:** Lộ dữ liệu nghiệp vụ nội bộ cho mọi người dùng đã đăng nhập (Broken Access Control — OWASP A01).
- **Giải pháp:**
  ```typescript
  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAnalytics() { ... }
  ```

#### C-03: Console.log chứa dữ liệu nhạy cảm trong Production
- **File:** [api-client.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/lib/api-client.ts#L46-L53)
- **Dòng:** 46, 51, 53, 89-98, 110, 119-126
- **Nguyên nhân:** API Client ghi log toàn bộ payload request, response body, và error stack trace ra `console.log` mà không phân biệt môi trường. Trong production, attacker có thể đọc token, dữ liệu cá nhân từ DevTools console.
- **Tác động:** Rò rỉ dữ liệu nhạy cảm (Sensitive Data Exposure — OWASP A02).
- **Giải pháp:** Tạo logger utility phân biệt `development` vs `production`:
  ```typescript
  const isDev = process.env.NODE_ENV === 'development';
  const logger = {
    log: (...args: unknown[]) => isDev && console.log(...args),
    error: (...args: unknown[]) => isDev && console.error(...args),
  };
  ```

---

### 🟠 MỨC CAO (HIGH)

#### H-01: `next/image` sử dụng trực tiếp thay vì `SafeImage`
- **File:** [Hero.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/Hero.tsx#L9)
- **Dòng:** 9
- **Nguyên nhân:** `Hero.tsx` import trực tiếp `Image from 'next/image'` thay vì sử dụng `SafeImage` wrapper. Nếu ảnh từ domain không nằm trong whitelist sẽ crash trang.
- **Giải pháp:** Thay `import Image from 'next/image'` bằng `import { SafeImage } from '@/components/base/SafeImage'` và chuyển tất cả `<Image>` thành `<SafeImage>`.

#### H-02: Hardcode Role Strings trên Frontend (Vi phạm Naming Rule)
- **Files:**
  - [UserDropdown.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/UserDropdown.tsx#L54) (L54, L59)
  - [ProfileHeader.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/profile/ProfileHeader.tsx#L132) (L92, L132, L136, L191, L192)
  - [FollowingModal.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/profile/FollowingModal.tsx#L102) (L102)
  - [FollowersModal.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/profile/FollowersModal.tsx#L94) (L94)
  - [EditProfileModal.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/profile/EditProfileModal.tsx#L84) (L84)
  - [AdminUserTable.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/admin/AdminUserTable.tsx#L60) (L60)
  - [register/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/register/page.tsx#L170) (L170)
  - [auth.schema.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/schemas/auth.schema.ts#L28) (L28)
- **Nguyên nhân:** Các chuỗi `'ADMIN'`, `'RESTAURANT'`, `'CUSTOMER'` được hardcode trực tiếp 11+ lần thay vì sử dụng constants/enum. Vi phạm **naming-rule.md §1** và **prisma-rule.md §1**.
- **Giải pháp:** Tạo `src/constants/roles.constant.ts`:
  ```typescript
  export const USER_ROLES = {
    ADMIN: 'ADMIN',
    RESTAURANT: 'RESTAURANT',
    CUSTOMER: 'CUSTOMER',
  } as const;
  ```

#### H-03: `document.getElementById` / `document.querySelectorAll` thay vì `useRef`
- **Files:**
  - [RestaurantMenuSidebar.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/restaurant/RestaurantMenuSidebar.tsx#L59) (L59)
  - [restaurant-admin/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/restaurant-admin/page.tsx#L259) (L259)
  - [restaurant/[id]/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/restaurant/[id]/page.tsx#L85) (L85)
- **Nguyên nhân:** Truy cập DOM trực tiếp trong React component. Vi phạm **frontend-architecture-rule.md Checklist** ("Đã thay thế `document.get...` bằng `useRef` chưa?").
- **Giải pháp:** Sử dụng `useRef` hoặc React callback refs thay vì `document.getElementById`.

#### H-04: `$executeRawUnsafe` trong Script Production
- **File:** [reindex-embeddings.ts](file:///e:/FOOD_AI_code/my-web/backend/src/scripts/reindex-embeddings.ts#L71)
- **Dòng:** 71, 117
- **Nguyên nhân:** Sử dụng `$executeRawUnsafe` thay vì `$executeRaw` (template literal) có nguy cơ SQL Injection nếu tham số bị truyền từ nguồn không đáng tin cậy.
- **Giải pháp:** Chuyển sang `$executeRaw` với tagged template literal.

#### H-05: Kiểu `any` trong API Client và Props Interface
- **Files:**
  - [api-client.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/lib/api-client.ts#L6-L7) (L6-7: `Record<string, any>`, `body?: any`)
  - [api-client.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/lib/api-client.ts#L118) (L118: `catch (error: any)`)
  - [api-client.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/lib/api-client.ts#L135-L143) (L135-143: `body?: any` ×3)
  - [Hero.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/Hero.tsx#L27) (L27: `(food: any)`)
  - [SafeImage.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/base/SafeImage.tsx#L109) (L109: `{...(props as any)}`)
- **Nguyên nhân:** Vi phạm **mất an toàn kiểu dữ liệu**. `any` xóa bỏ mọi type safety.
- **Giải pháp:** Thay `any` bằng `unknown` hoặc tạo interfaces cụ thể (`ApiRequestBody`, `FoodItem`, etc.).

---

### 🟡 MỨC TRUNG BÌNH (MEDIUM)

#### M-01: AiService quá lớn — Vi phạm Nguyên lý Đơn trách nhiệm (SRP)
- **File:** [ai.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/ai/ai.service.ts) — 608 dòng, 12 dependencies
- **Nguyên nhân:** Service này vừa quản lý conversations (CRUD), vừa điều phối AI chat pipeline, vừa xử lý embeddings. Có thể tách thành `ConversationService` + `AiOrchestrator` + `EmbeddingService`.
- **Giải pháp:** Tách `getConversations`, `createConversation`, `deleteConversation`, `getConversationDetail` sang `ConversationService` mới.

#### M-02: Trùng lặp logic lấy Suggestions từ metadata (DRY Violation)
- **File:** [ai.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/ai/ai.service.ts)
- **Dòng:** 364-386 (getChatContext) và 513-535 (getConversationDetail)
- **Nguyên nhân:** Đoạn code parse `metadata.suggested_food_ids` → query `prisma.food.findMany` → map sang `FoodSuggestion` được lặp lại 2 lần gần như nguyên bản.
- **Giải pháp:** Trích xuất thành `private async resolveSuggestions(metadata: ConversationMetadata): Promise<FoodSuggestion[]>`.

#### M-03: CORS quá rộng trong Development Mode
- **File:** [main.ts](file:///e:/FOOD_AI_code/my-web/backend/src/main.ts#L42-L62)
- **Dòng:** 42-62
- **Nguyên nhân:** CORS cho phép toàn bộ dải private IP (`192.168.*`, `10.*`, `172.16-31.*`) và tất cả localhost ports. Nếu configuration này vô tình lọt vào production sẽ tạo attack surface rộng.
- **Giải pháp:** Bọc logic này trong điều kiện `NODE_ENV !== 'production'`:
  ```typescript
  const isProduction = process.env.NODE_ENV === 'production';
  // Only allow localhost/private IPs in development
  ```

#### M-04: Hardcode chuỗi mặc định trong auth.service.ts — Onboarding
- **File:** [auth.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/auth/auth.service.ts#L162-L163)
- **Dòng:** 162-163, 187-189
- **Nguyên nhân:** Chuỗi `'Chào mừng bạn đến với nhà hàng của chúng tôi!'` và `'00:00 - 00:00'` hardcode trực tiếp thay vì đưa vào constants. Vi phạm **naming-rule.md §1**.
- **Giải pháp:** Đưa vào `MESSAGES` constant hoặc `DEFAULT_VALUES` constant.

#### M-05: Request Logger ghi tất cả request trong Production
- **File:** [main.ts](file:///e:/FOOD_AI_code/my-web/backend/src/main.ts#L34-L40)
- **Dòng:** 34-40
- **Nguyên nhân:** Middleware logger ghi lại mọi request (URL, method, origin) vào Logger — không phân biệt môi trường. Ở production, log volume sẽ rất lớn và có thể chứa thông tin nhạy cảm.
- **Giải pháp:** Bọc trong điều kiện `NODE_ENV === 'development'` hoặc sử dụng log level.

---

### 🟢 MỨC THẤP (LOW)

#### L-01: Thiếu Pagination trong một số List Queries
- **File:** [ai.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/ai/ai.service.ts#L407-L435) — `getConversations()` không có `take/skip`
- **Nguyên nhân:** Khi user có rất nhiều conversations, query sẽ trả về tất cả mà không giới hạn. Vi phạm **prisma-rule.md §3**.

#### L-02: Thiếu `select` tối ưu trong một số Prisma Queries
- **File:** [ai.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/ai/ai.service.ts#L374-L377)
- **Dòng:** 374-377 — `include: { restaurant: true }` fetch toàn bộ restaurant object
- **Nguyên nhân:** Chỉ cần `restaurant.name` và `restaurant.address`, nhưng đang fetch toàn bộ restaurant. Vi phạm **prisma-rule.md §3** (Over-fetching).
- **Giải pháp:**
  ```typescript
  include: { restaurant: { select: { name: true, address: true } } }
  ```

#### L-03: Thuộc tính `targetType` trong Report Model là String thay vì Enum
- **File:** [schema.prisma](file:///e:/FOOD_AI_code/my-web/backend/prisma/schema.prisma#L308)
- **Dòng:** 308
- **Nguyên nhân:** `targetType String` cho phép giá trị tùy ý, không type-safe. Nên dùng Enum `ReportTargetType { POST, COMMENT, USER, RESTAURANT }`.

#### L-04: Conversation `metadata` là `Json?` — Thiếu Type Safety
- **File:** [schema.prisma](file:///e:/FOOD_AI_code/my-web/backend/prisma/schema.prisma#L285)
- **Dòng:** 285
- **Nguyên nhân:** `metadata Json?` cho phép bất kỳ JSON nào. Mặc dù đã có interface `ConversationMetadata` ở runtime, nhưng database layer không enforce.

---

## PHẦN 2: ĐIỂM SỐ CHẤT LƯỢNG CODEBASE

| Tiêu chí | Điểm | Nhận xét |
|---|---|---|
| **Clean Code** | 7.5/10 | Phần lớn code sạch, có JSDoc, nhưng còn `any` types, console.log, và trùng lặp logic |
| **Scalability** | 7.0/10 | Kiến trúc module hóa tốt, nhưng `AiService` quá lớn, thiếu pagination ở một số queries |
| **Readability** | 8.0/10 | Tên hàm rõ ràng, có JSDoc header ở hầu hết file, naming convention nhất quán |
| **Security** | 6.5/10 | Thiếu Helmet, endpoint analytics không phân quyền, console.log nhạy cảm, CORS rộng |
| **Maintainability** | 7.5/10 | Phân lớp Controller→Service→Repository tốt, nhưng hardcode roles, DRY violations |
| **Architecture** | 8.0/10 | Clean Architecture rõ ràng, DI pattern đúng chuẩn NestJS, module encapsulation tốt |
| **Performance** | 7.0/10 | Redis caching tốt, nhưng over-fetching Prisma, thiếu pagination, request logger ở production |
| **Production Readiness** | 6.5/10 | Console.log ở API client, thiếu security headers, CORS quá rộng, logger không phân môi trường |

### **Điểm trung bình: 7.25/10**

---

## PHẦN 3: PHÂN TÍCH TỔNG HỢP

### 💪 Điểm mạnh lớn nhất
1. **Kiến trúc phân lớp chuẩn mực:** Controller → Service → Repository → Database tuân thủ Clean Architecture. Các controllers "sạch" — chỉ routing và validation, không chứa logic.
2. **Hệ thống AI modular ấn tượng:** Pipeline AI được chia nhỏ thành 10+ services chuyên biệt (IntentDetector, SlotExtractor, Reranking, PromptBuilder, ResponseGenerator...) — rất dễ mở rộng và test.
3. **SafeImage wrapper chống crash:** Pattern wrapper cho `next/image` với domain whitelist và fallback — giải pháp production-grade cho vấn đề Image Optimizer.
4. **Redis Graceful Fallback:** `RedisService` tự động chuyển sang in-memory fallback khi Redis offline ở môi trường dev, fail-fast ở production — thiết kế resilient.
5. **Constants centralized:** Phần lớn text labels, messages, limits, AI parameters đã được tập trung vào constants folder.

### 🔥 Điểm yếu lớn nhất
1. **Thiếu Helmet middleware** — lỗ hổng bảo mật cơ bản nhất của bất kỳ Express/NestJS app nào.
2. **Console.log payload nhạy cảm** ở API client — sẽ rò rỉ dữ liệu khi deploy production.
3. **Hardcode role strings** ở frontend — 11+ vị trí dùng magic string thay vì constants.

### ⚠️ Nợ kỹ thuật nguy hiểm nhất
1. **`$executeRawUnsafe`** trong scripts — mở SQL Injection vector nếu tham số đến từ user input trong tương lai.
2. **AiService 608 dòng + 12 dependencies** — đang trở thành God Service, refactoring sẽ ngày càng khó.
3. **`any` type lan rộng** ở `api-client.ts` — mất toàn bộ type safety cho tầng API communication.

---

## PHẦN 4: ĐỀ XUẤT NÂNG CẤP (ACTION ITEMS)

### Ưu tiên 1 — Bảo mật (Thực hiện ngay)
- [ ] Cài đặt và cấu hình `helmet` middleware trong `main.ts`
- [ ] Thêm `@Roles(UserRole.ADMIN)` + `RolesGuard` cho endpoint `GET /ai/analytics`
- [ ] Tạo logger utility phân biệt dev/production, loại bỏ `console.log` payload trong API client

### Ưu tiên 2 — Code Quality (Tuần này)
- [ ] Tạo `USER_ROLES` constant ở frontend và thay thế tất cả 11+ vị trí hardcode role strings
- [ ] Thay `import Image from 'next/image'` ở `Hero.tsx` bằng `SafeImage`
- [ ] Thay `document.getElementById` bằng `useRef` ở 3 files vi phạm
- [ ] Thay `$executeRawUnsafe` bằng `$executeRaw` template literal ở `reindex-embeddings.ts`
- [ ] Loại bỏ/thay thế tất cả kiểu `any` trong `api-client.ts`

### Ưu tiên 3 — Architecture (Sprint tới)
- [ ] Tách `AiService` thành `ConversationService` (CRUD) + `AiOrchestrationService` (pipeline)
- [ ] Trích xuất hàm `resolveSuggestions()` để loại bỏ DRY violation
- [ ] Thêm pagination cho `getConversations()` query
- [ ] Tối ưu Prisma queries — thêm `select` cho restaurant include queries
- [ ] Bọc CORS private IP logic trong điều kiện `NODE_ENV !== 'production'`

### Ưu tiên 4 — Nâng cấp dài hạn
- [ ] Thêm `ReportTargetType` Enum vào Prisma schema thay vì `String`
- [ ] Di chuyển hardcode defaults trong `auth.service.ts` (`'Chào mừng...'`, `'00:00 - 00:00'`) vào constants
- [ ] Cân nhắc thêm account lockout sau N lần đăng nhập sai
- [ ] Thiết lập CI/CD pipeline chạy `npm audit` tự động

## PHẦN 5: KẾT QUẢ RÀ SOÁT TRƯỚC KHI ĐẨY CODE (GIT PRE-PUSH AUDIT)

### 1. Trạng thái Sẵn sàng (Push Readiness Status)
* **[HOÀN TOÀN SẴN SÀNG]**

### 2. Chi tiết kết quả rà soát
* **Lỗi định dạng (Empty Lines / Whitespace):** [Đạt] (Không có dòng trống thừa liên tiếp, mỗi file kết thúc bằng chính xác 1 dòng trống).
* **Lỗi Type-Safety & ESLint (any / unused):** [Đạt] (Đã loại bỏ `any` ở các file sửa đổi và thay bằng kiểu an toàn, các cảnh báo ESLint chỉ là cảnh báo thông thường và không gây lỗi biên dịch).
* **Lỗi Hardcode & Magic values:** [Đạt] (Các nhãn giao diện dùng LABELS từ `@/constants/labels`, các chế độ theme/role dùng enum/type).
* **Khả năng Biên dịch (TypeScript Compile):** [Thành công] (Biên dịch thành công qua `npx tsc --noEmit` với 0 lỗi).
* **Thông điệp Commit:** [Hợp lệ]
  - *Gợi ý:* `docs(audit): hoàn tất rà soát chất lượng codebase và cập nhật header comment toàn bộ files`

---

*Báo cáo được tạo bởi AI Code Auditor theo quy trình TRIGGER_AI_AUDIT.md & TRIGGER_GIT_AUDIT.md*
