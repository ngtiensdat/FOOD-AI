# 🚀 ROADMAP: Production-Ready SaaS — Backend Audit

**Ngày tạo:** 12/06/2026
**Nhánh:** `feature/update-prisma`
**Mục tiêu:** Nâng cấp backend từ trạng thái "hoạt động tốt" → "bán được như sản phẩm SaaS thương mại"

---

## Phase 1: 🛡️ Error Handling & Resilience (Ưu tiên: CAO)

### 1.1 Global Error Handling nâng cao
- [x] **Thêm Error Correlation ID** — Tạo `X-Request-Id` header middleware trong `main.ts`, truyền vào `AllExceptionsFilter` để gắn vào mỗi response lỗi → Giúp debug production nhanh gấp 10x
  - File: `src/main.ts`, `src/common/filters/all-exceptions.filter.ts`
- [x] **Structured Logging** — Thay thế `Logger.log/warn/error` thủ công bằng structured logger (Winston/Pino) với JSON format → Tương thích ELK/Datadog/CloudWatch
  - File: `src/main.ts`, tạo `src/common/logger/`
- [x] **Circuit Breaker cho External Services** — Thêm circuit breaker pattern cho OpenAI API calls và Weather API calls trong AI module để tránh cascade failure khi dịch vụ ngoài chết
  - File: `src/modules/ai/services/openai.service.ts`, `src/modules/ai/services/weather.service.ts`

### 1.2 Service-Level Error Recovery
- [x] **Retry Logic cho AI Embedding** — `updateFoodEmbedding()` và `updateUserEmbedding()` hiện chỉ catch + log, cần thêm retry với exponential backoff (3 lần)
  - File: `src/modules/ai/ai.service.ts` (L733-776)
- [x] **Dead Letter Queue** — Khi embedding thất bại sau retry, push vào Redis queue để xử lý lại sau (cron job mỗi 30 phút)
  - File: Tạo `src/common/services/retry-queue.service.ts`
- [x] **Graceful Shutdown** — Thêm `app.enableShutdownHooks()` trong `main.ts` để đóng Prisma connection và Redis connection sạch sẽ khi container bị kill
  - File: `src/main.ts`

---

## Phase 2: ⚡ Caching Strategy (Ưu tiên: CAO)

### 2.1 Redis Cache Layer
- [x] **Cache `getAllFoods()`** — Kết quả danh sách foods (query phổ biến nhất) cần được cache 5 phút, invalidate khi có tạo/cập nhật/xóa food
  - File: `src/modules/food/food.service.ts` (L37-101)
- [x] **Cache `getFeaturedToday()` / `getFeaturedWeekly()` / `getRecommended()`** — 3 endpoint này trả data ít thay đổi, cache 15-30 phút
  - File: `src/modules/food/food.service.ts` (L380-408)
- [x] **Cache `getAllPosts()`** — Forum posts không cần realtime, cache 2-3 phút, invalidate khi tạo/xóa post
  - File: `src/modules/social/post.service.ts` (L66-199)
- [x] **Cache `getPublicRestaurant()`** — Thông tin nhà hàng ít thay đổi, cache 10 phút
  - File: `src/modules/food/food.service.ts` (L514-567)

### 2.2 Cache Abstraction
- [x] **Tạo CacheService wrapper** — Đóng gói logic `get → miss → fetch → set` vào một service chung, hỗ trợ TTL và cache key pattern
  - File: Tạo `src/common/services/cache.service.ts`
- [x] **Cache Invalidation Decorator** — Tạo custom decorator `@InvalidateCache('foods:*')` để tự động xóa cache khi service method được gọi (create, update, delete)
  - File: Tạo `src/common/decorators/invalidate-cache.decorator.ts`

---

## Phase 3: 🗄️ Database Optimization (Ưu tiên: CAO)

### 3.1 Missing Indexes
- [x] **Index `foods.city` và `foods.district`** — `getAllFoods()` dùng filter city/district qua `address LIKE '%city%'` nhưng không có index
  - File: `prisma/schema.prisma` (model Food)
- [x] **Composite Index `foods(is_active, status, restaurant_id)`** — Query phổ biến nhất filter theo 3 trường này cùng lúc
  - File: `prisma/schema.prisma` (model Food, hiện chỉ có `@@index([restaurantId, status])`)
- [x] **Index `conversations.user_id`** — AI chat query luôn filter theo `userId` nhưng chưa có index
  - File: `prisma/schema.prisma` (model Conversation)
- [x] **Index `histories.food_id`** — `getMyAnalytics()` count histories theo foodId, cần index
  - File: `prisma/schema.prisma` (model History)
- [x] **Index `favorites.food_id`** — Lookup favorite theo foodId khi toggle
  - File: `prisma/schema.prisma` (model Favorite)

### 3.2 N+1 Query Prevention
- [x] **Fix N+1 trong `getMyAnalytics()`** — Hiện tại loop qua từng food và count histories + aiFeedbacks riêng lẻ (N+1). Chuyển sang `groupBy` aggregate query
  - File: `src/modules/food/food.service.ts` (L660-687)
- [x] **Fix N+1 trong `getAllPosts()`** — Load likes + comments + replies cho tất cả posts cùng lúc, sử dụng Prisma include đã đúng nhưng cần verify khi data lớn
  - File: `src/modules/social/post.service.ts` (L66-199) — thêm pagination (hiện load ALL posts)

### 3.3 Query Optimization
- [x] **Thêm Pagination cho `getAllPosts()`** — Hiện tải TẤT CẢ posts không giới hạn (!!), cần thêm cursor-based pagination
  - File: `src/modules/social/post.service.ts` (L66-199)
- [x] **Thêm Pagination cho `getAllFoods()` trong admin** — `adminService.getAllFoods()` load tất cả foods không limit
  - File: `src/modules/admin/admin.service.ts` (L47-49), `src/modules/food/food.repository.ts` (L305-315)
- [x] **Thêm Pagination cho `getMerchantFoods()`** — Load tất cả món ăn của merchant không limit
  - File: `src/modules/food/food.service.ts` (L442-451)

---

## Phase 4: 🔐 Security Hardening (Ưu tiên: CAO)

### 4.1 Authentication & Authorization
- [x] **Helmet.js Integration** — Thêm `app.use(helmet())` vào `main.ts` để set security headers (X-Frame-Options, X-Content-Type-Options, CSP)
  - File: `src/main.ts`
- [x] **CORS Production Lock** — Wrap dải IP private (192.168.x, 10.x, 172.x) trong `process.env.NODE_ENV !== 'production'` guard
  - File: `src/main.ts` (L42-62)
- [x] **Request Logger Guard** — Wrap request logger middleware trong production check để không log sensitive data
  - File: `src/main.ts` (L35-40)
- [x] **Refresh Token Rotation** — Hiện tại refresh token được lưu plaintext trong DB. Cần hash refresh token trước khi lưu (giống password)
  - File: `src/modules/auth/auth.service.ts` (L317-321)

### 4.2 Rate Limiting
- [x] **Global API Rate Limit** — Thêm ThrottlerModule với default 100 req/min cho tất cả endpoint, riêng auth endpoints 10 req/min
  - File: `src/app.module.ts`
- [x] **Registration Rate Limit** — Giới hạn đăng ký 3 accounts/IP/hour để chống spam
  - File: `src/modules/auth/auth.controller.ts`

### 4.3 Input Sanitization
- [x] **Sanitize HTML trong Post content** — User có thể chèn XSS qua `content` khi tạo post. Cần sanitize HTML input
  - File: `src/modules/social/post.service.ts` (L202-236)
- [x] **Sanitize tên người dùng** — Loại bỏ HTML tags từ `name` khi register
  - File: `src/modules/auth/auth.service.ts` (L47-79)

---

## Phase 5: 🤖 AI Cost Optimization (Ưu tiên: TRUNG BÌNH)

### 5.1 Token & Call Reduction
- [x] **Embedding Cache** — Cache OpenAI embedding results trong Redis (key = hash(text), TTL = 24h). Tránh gọi lại cho text giống nhau
  - File: `src/modules/ai/services/openai.service.ts`
- [x] **Intent Detection Cache** — Nếu message giống hệt đã detect trước đó, trả cached intent thay vì gọi LLM
  - File: `src/modules/ai/services/intent-detector.service.ts`
- [x] **Prompt Compression** — Giảm system prompt size bằng cách rút gọn candidates section (chỉ gửi top 5 thay vì tất cả)
  - File: `src/modules/ai/services/prompt-builder.service.ts`
- [x] **Token Usage Tracking** — Log số token consumed mỗi request vào DB/Redis để theo dõi chi phí hàng ngày
  - File: `src/modules/ai/services/openai.service.ts`

### 5.2 Smart Fallback
- [x] **Local Intent Fallback** — Nếu message đơn giản (greetings, thanks), trả reply hardcoded không cần gọi OpenAI
  - File: `src/modules/ai/ai.service.ts` (L85-533)
- [x] **Budget Alert** — Khi token usage vượt ngưỡng daily budget (configurable), trả warning cho admin
  - File: Tạo `src/modules/ai/services/budget-tracker.service.ts`

---

## Phase 6: 🗑️ Soft Delete & Data Integrity (Ưu tiên: TRUNG BÌNH)

### 6.1 Consistent Soft Delete
- [x] **Soft Delete cho Posts** — `post.service.ts` và `report.service.ts` sử dụng soft delete cho Post thay vì hard delete
  - File: `src/modules/report/report.service.ts` (L53)
- [x] **Soft Delete cho User** — `auth.service.ts` deleteAccount đang hard delete (`prisma.user.delete`). Chuyển sang soft delete (set `deletedAt`, deactivate restaurants)
  - File: `src/modules/auth/auth.service.ts` (L268-291)
- [x] **Global Soft Delete Filter** — Thêm Prisma middleware hoặc `$extends` để tự động filter `deletedAt IS NULL` cho tất cả queries
  - File: `src/database/prisma.service.ts`

### 6.2 Data Archival
- [x] **Message Archival** — Conversations cũ (> 30 ngày) nên được archive ra bảng riêng hoặc cold storage
  - File: Tạo `src/scripts/archive-old-conversations.ts`
- [x] **History Deduplication** — `trackView()` tạo bản ghi mới mỗi lần xem cùng một food, cần dedupe (chỉ update `visitedAt`)
  - File: `src/modules/food/food.repository.ts` (L52-66)

---

## Phase 7: 🧪 Testing & Observability (Ưu tiên: TRUNG BÌNH)

### 7.1 Test Coverage
- [x] **Unit Tests cho FoodService** — Test getAllFoods, createFood, updateFood, deleteFood với mock Prisma
- [x] **Unit Tests cho AuthService** — Test login rate limiting, register, deleteAccount
- [x] **Unit Tests cho PostService** — Test awardPoints, toggleLike, createComment
- [x] **Integration Tests cho AI flow** — Test chat endpoint end-to-end với mocked OpenAI

### 7.2 Health Check & Monitoring
- [x] **Health Check Endpoint** — Thêm `/health` endpoint kiểm tra Prisma + Redis connectivity
  - File: `src/app.controller.ts`
- [x] **Readiness/Liveness Probes** — Tách `/health/ready` (DB connected) và `/health/live` (process alive) cho K8s
  - File: `src/app.controller.ts`

---

## Phase 8: 📐 Architecture Clean-up (Ưu tiên: THẤP)

### 8.1 Schema Consistency
- [ ] **Coordinate Naming** — `Food` dùng `lat/lng`, `Restaurant` dùng `latitude/longitude`. Cần thống nhất
  - File: `prisma/schema.prisma`
- [ ] **Follow Model Merge** — Có cả `Follow` (user→restaurant) và `UserFollow` (user→user). Cân nhắc merge thành polymorphic pattern
  - File: `prisma/schema.prisma`

### 8.2 Hardcoded Strings
- [x] **Hardcoded Vietnamese trong post.service** — `deleteComment` ném lỗi bằng string tiếng Việt raw thay vì `MESSAGES` constant
  - File: `src/modules/social/post.service.ts` (L316, L321)
- [x] **Hardcoded badge defaults** — `awardPoints()` có fallback badge list hardcoded. Move vào constants hoặc DB seed
  - File: `src/modules/social/post.service.ts` (L41-53)

### 8.3 Code Duplication
- [x] **Empty Conversation Cleanup** — Logic xóa empty conversations bị duplicate giữa `getConversations()` và `createConversation()` trong AI service
  - File: `src/modules/ai/ai.service.ts` (L598-688)
- [x] **Restaurant Ownership Check** — Pattern `findRestaurantByOwnerId → if (!restaurant) throw` lặp lại 5+ lần. Tách thành `ensureRestaurantOwnership()` helper
  - File: `src/modules/food/food.service.ts` (L476-512)

---

## 📊 Tổng hợp Effort Estimation

| Phase | Số Tasks | Effort (days) | Priority |
|-------|----------|---------------|----------|
| 1. Error Handling | 6 | 3-4 | 🔴 CAO |
| 2. Caching | 6 | 3-4 | 🔴 CAO |
| 3. DB Optimization | 8 | 2-3 | 🔴 CAO |
| 4. Security | 7 | 2-3 | 🔴 CAO |
| 5. AI Cost | 6 | 3-4 | 🟡 TRUNG BÌNH |
| 6. Soft Delete | 5 | 2-3 | 🟡 TRUNG BÌNH |
| 7. Testing | 6 | 4-5 | 🟡 TRUNG BÌNH |
| 8. Architecture | 5 | 2-3 | 🟢 THẤP |
| **TỔNG** | **49** | **~21-29 ngày** | |

---

## ✅ Thứ tự thực hiện đề xuất

```
Week 1-2: Phase 3 (DB Indexes) → Phase 4 (Security) → Phase 1 (Error Handling cơ bản)
Week 3-4: Phase 2 (Caching) → Phase 5 (AI Cost) → Phase 6 (Soft Delete)
Week 5+:  Phase 7 (Testing) → Phase 8 (Clean-up)
```

> **Lưu ý quan trọng:** Phase 3 (DB Indexes) nên làm ĐẦU TIÊN vì chỉ cần thêm `@@index` vào schema và chạy migration — effort rất nhỏ nhưng impact rất lớn khi data scale.
