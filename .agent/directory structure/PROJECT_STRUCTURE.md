# Cấu trúc Dự án FOOD_AI — Mạng Xã Hội Ẩm Thực Tích Hợp AI

> **Cập nhật lần cuối:** 2026-07-14
> **Ghi nhớ bởi:** Antigravity AI Agent
> **Mục đích:** Cung cấp bản đồ toàn diện cấu trúc thư mục và kiến trúc hệ thống để các phiên làm việc tiếp theo không cần khám phá lại từ đầu.

---

## THÔNG TIN CHUNG

| Thuộc tính | Giá trị |
|-----------|---------|
| **Tên đề tài** | Xây dựng mạng xã hội ẩm thực tích hợp hệ thống gợi ý bằng trí tuệ nhân tạo |
| **Workspace** | `e:\FOOD_AI_code` |
| **Monorepo root** | `e:\FOOD_AI_code\my-web` |
| **Backend port** | `3001` (NestJS) |
| **Frontend port** | `3000` (Next.js) |
| **Dev command** | `npm run dev` (từ `e:\FOOD_AI_code`) — chạy cả 2 process song song |
| **Database** | PostgreSQL + pgvector extension |
| **Redis** | In-Memory fallback khi Redis offline (development mode) |

---

## CẤU TRÚC THƯ MỤC GỐC (`e:\FOOD_AI_code`)

```
e:\FOOD_AI_code\
├── .agent/                        # Cấu hình quy tắc cho AI Agent
│   ├── directory structure/       # Tài liệu cấu trúc dự án (file này)
│   ├── rule/                      # Quy tắc code, commit, naming convention
│   ├── skills/                    # Kỹ năng chuyên biệt của agent
│   └── workflow/                  # Quy trình làm việc chuẩn
├── .check-prompt/                 # Prompt mẫu để AI chấm điểm/review code
├── .todo/                         # Báo cáo Audit được xuất ra đây
├── .vscode/                       # Cấu hình VS Code workspace
├── documents/                     # Tài liệu kỹ thuật, SRS, ERD...
│   └── 08-conventions/            # Quy ước code và git
├── my-web/                        # Monorepo chứa Backend + Frontend
│   ├── backend/                   # NestJS API Server
│   ├── frontend/                  # Next.js Web Application
│   └── Sample_Merchants.xlsx      # Dữ liệu mẫu nhà hàng để import
├── TRIGGER_AI_AUDIT.md            # Kích hoạt quy trình kiểm toán code
├── TRIGGER_GIT_AUDIT.md           # Kích hoạt quy trình kiểm tra Git
├── TRIGGER_Mini_check_file.md     # Kích hoạt kiểm tra nhanh 1 file
├── PROMPT_Phone_Store_UI.md       # Prompt tạo web bán điện thoại
└── package.json                   # Root workspace package (husky, commitlint)
```

---

## BACKEND (`e:\FOOD_AI_code\my-web\backend`)

### Công nghệ
- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma (PostgreSQL + pgvector)
- **Auth:** JWT (Access Token 15 phút + Refresh Token 7 ngày, HTTP-Only Cookie)
- **AI/LLM:** LangChain + OpenAI API (`gpt-4o` cho chat, `text-embedding-ada-002` cho vector)
- **Cache/Rate Limit:** Redis (In-Memory fallback khi offline)
- **Security:** Helmet, CORS, Global Rate Limiter (CustomThrottlerGuard), RBAC

### Cấu trúc Backend

```
backend/
├── prisma/
│   └── schema.prisma              # 39 Prisma Models
├── src/
│   ├── main.ts                    # Khởi động app, CORS, Helmet, Guards
│   ├── app.module.ts              # Root module, ThrottlerModule, APP_GUARD
│   ├── app.controller.ts          # Health check endpoint
│   ├── common/                    # Các thành phần dùng chung
│   │   ├── constants/             # messages.constant.ts, error-codes.constant.ts, enums.constant.ts, ai.constant.ts
│   │   ├── decorators/            # @GetUser(), @Roles()
│   │   ├── filters/               # AllExceptionsFilter (xử lý lỗi toàn cục)
│   │   ├── guards/                # JwtAuthGuard, JwtAuthOptionalGuard, CustomThrottlerGuard
│   │   ├── i18n/                  # Đa ngôn ngữ (vi/en)
│   │   ├── interceptors/          # Response transform interceptor
│   │   ├── redis/                 # RedisService (Cache, Lock, Rate Limit)
│   │   ├── strategies/            # JWT Strategy (Passport)
│   │   └── utils/                 # BcryptHelper, formatters
│   ├── config/
│   │   └── app.config.ts          # Cấu hình env vars (JWT, DB, Redis, OpenAI)
│   ├── database/
│   │   └── prisma.service.ts      # PrismaService (singleton DB connection)
│   └── modules/                   # 20 Business Modules
│       ├── admin/                 # Quản trị hệ thống (duyệt nhà hàng, quản lý user)
│       ├── ai/                    # AI Engine (LangChain, OpenAI, Vector Search)
│       │   ├── ai.controller.ts   # Endpoints: /ai/chat, /ai/conversations, /ai/weather, /ai/feedback
│       │   ├── ai.service.ts      # Orchestrator chính của AI pipeline
│       │   ├── vector.repository.ts # pgvector cosine distance queries
│       │   ├── constants/         # AI config constants
│       │   ├── dto/               # ChatDto, AiFeedbackDto...
│       │   ├── prompts/           # Prompt templates cho LangChain
│       │   └── services/          # 23 Sub-services của AI module:
│       │       ├── intent-detector.service.ts      # Nhận diện ý định người dùng
│       │       ├── slot-extractor.service.ts       # Trích xuất thực thể (slots)
│       │       ├── food-retrieval.service.ts       # Hybrid search (vector + SQL)
│       │       ├── recommendation.service.ts       # Xếp hạng và lọc gợi ý
│       │       ├── response-generator.service.ts   # Tạo phản hồi LLM structured output
│       │       ├── reranking.service.ts            # Re-ranking candidates
│       │       ├── prompt-builder.service.ts       # Xây dựng prompt ngữ cảnh
│       │       ├── langchain.service.ts            # LangChain model instances
│       │       ├── openai.service.ts               # Embedding + Circuit Breaker
│       │       ├── weather.service.ts              # Lấy thời tiết Open-Meteo API
│       │       ├── ai-learning.service.ts          # Implicit learning từ hành vi
│       │       ├── embedding-cache.service.ts      # Cache vector embeddings
│       │       ├── vector-sync.service.ts          # Đồng bộ embeddings lên pgvector
│       │       └── dialogue-state-manager.service.ts # Quản lý trạng thái hội thoại
│       ├── auth/                  # Đăng ký, Đăng nhập, OTP, Refresh Token, Đổi mật khẩu
│       ├── badge/                 # Hệ thống Gamification (Badges, XP, Level)
│       ├── bug-report/            # Báo cáo lỗi từ người dùng
│       ├── category/              # Quản lý danh mục món ăn (CategoryGroup, Category)
│       ├── chat/                  # Chat thời gian thực (Socket.io, Direct Messages)
│       ├── food/                  # Quản lý món ăn, Nhà hàng, Theo dõi, Lời mời nhân viên
│       │   ├── restaurant.service.ts               # Logic nhà hàng (1200+ dòng)
│       │   ├── restaurant-public.controller.ts     # Public API nhà hàng
│       │   └── restaurant-admin.controller.ts      # Admin API nhà hàng (có RBAC)
│       ├── inventory/             # Quản lý tồn kho món ăn
│       ├── mail/                  # Gửi email OTP, xác thực, thông báo
│       ├── media/                 # Upload ảnh lên Cloudinary
│       ├── notification/          # Thông báo hệ thống + WebSocket Gateway
│       ├── offer/                 # Quản lý ưu đãi (Offers) của nhà hàng
│       ├── order/                 # Tạo hóa đơn, lịch sử đơn hàng
│       ├── pos-terminal/          # Quản lý máy POS, đăng nhập thiết bị, nhật ký POS
│       ├── report/                # Báo cáo vi phạm bài viết
│       ├── social/                # Mạng xã hội (Posts, Likes, Comments, Forum)
│       ├── table/                 # Quản lý bàn ăn (DiningTable)
│       ├── user/                  # Hồ sơ người dùng, tìm kiếm, cập nhật avatar
│       └── voucher/               # Quản lý mã giảm giá, điểm thưởng
```

### Prisma Models (39 models)
| Nhóm | Models |
|------|--------|
| **Người dùng** | `User`, `UserProfile` |
| **Nhà hàng** | `Restaurant`, `RestaurantProfile` |
| **Thực phẩm** | `Food`, `CategoryGroup`, `Category` |
| **Mạng xã hội** | `Post`, `Like`, `Comment`, `Follow`, `UserFollow`, `Favorite`, `SavedPost`, `Report` |
| **AI & Vector** | `AiFeedback`, `EmbeddingLog`, `Conversation`, `Message` |
| **Giao dịch** | `Order`, `OrderItem`, `Voucher`, `UserVoucher`, `PointCode`, `Offer` |
| **Gamification** | `BadgeConfig`, `GamificationConfig` |
| **Hệ thống** | `Notification`, `BugReport`, `History` |
| **Chat** | `DirectConversation`, `DirectMessage`, `DirectParticipant` |
| **Nhân sự** | `StaffHistory`, `StaffInvitation`, `StaffReview` |
| **POS** | `PosTerminal`, `PosTerminalLog` |
| **Nhà hàng** | `DiningTable` |

### Phân quyền vai trò (RBAC)
| Role | Quyền hạn |
|------|-----------|
| `CUSTOMER` | Đặt hàng, viết bài, like, follow, dùng AI chatbot |
| `RESTAURANT` | Quản lý nhà hàng (Merchant Hub), thực đơn, nhân viên, bàn, POS |
| `STAFF` | Đăng nhập máy POS, tạo hóa đơn cho khách |
| `ADMIN` | Quản trị toàn hệ thống |

---

## FRONTEND (`e:\FOOD_AI_code\my-web\frontend`)

### Công nghệ
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (`src/index.css`) — KHÔNG dùng Tailwind
- **State:** Zustand (`useAuthStore`, `useToastStore`)
- **Icons:** Lucide React
- **Image:** Wrapper `SafeImage.tsx` (next/image + fallback)
- **Font:** Tích hợp qua CSS `@import`

### Cấu trúc Frontend

```
frontend/src/
├── app/                           # Next.js App Router (các trang)
│   ├── page.tsx                   # Trang chủ (Home Feed)
│   ├── layout.tsx                 # Root layout (Providers, Fonts)
│   ├── admin/                     # /admin — Quản trị hệ thống
│   ├── badges/                    # /badges — Thành tích, danh hiệu
│   ├── contact/                   # /contact — Liên hệ
│   ├── dashboard/                 # /dashboard — Hồ sơ cá nhân
│   ├── explore/                   # /explore — Khám phá món ăn
│   ├── forum/                     # /forum — Mạng xã hội ẩm thực
│   ├── login/                     # /login — Đăng nhập
│   ├── register/                  # /register — Đăng ký
│   ├── verify-email/              # /verify-email — Xác thực email OTP
│   ├── forgot-password/           # /forgot-password
│   ├── reset-password/            # /reset-password
│   ├── pos/                       # /pos — Giao diện POS thu ngân
│   ├── profile/[id]/              # /profile/:id — Trang cá nhân người dùng
│   ├── restaurant/[id]/           # /restaurant/:id — Trang nhà hàng công khai
│   ├── restaurant-admin/          # /restaurant-admin — Merchant Hub (Quản lý nhà hàng)
│   ├── vouchers/                  # /vouchers — Ví voucher của người dùng
│   └── policy/, terms/            # Trang pháp lý
│
├── components/
│   ├── base/                      # Atomic components tái sử dụng
│   │   ├── Button.tsx             # Nút bấm với variants
│   │   ├── Input.tsx              # Ô nhập liệu
│   │   ├── SafeImage.tsx          # Wrapper next/image với onError fallback
│   │   └── ...
│   └── features/                  # Smart components theo tính năng
│       ├── Navbar.tsx             # Thanh điều hướng (25KB — component lớn nhất)
│       ├── Hero.tsx               # Banner trang chủ
│       ├── Footer.tsx
│       ├── OnboardingModal.tsx    # Modal hoàn thiện hồ sơ lần đầu
│       ├── SettingsSection.tsx    # Cài đặt tài khoản
│       ├── UserDropdown.tsx       # Dropdown menu người dùng
│       ├── admin/                 # Components Admin Dashboard
│       ├── ai/                    # AI Chatbot UI
│       ├── assistive-touch/       # Nút trợ giúp nổi (AssistiveTouch)
│       ├── badges/                # Hiển thị thành tích Gamification
│       ├── chat/                  # Giao diện Chat trực tiếp
│       ├── food/                  # Card món ăn, danh sách...
│       ├── offers/                # Hiển thị ưu đãi nhà hàng
│       ├── pos/                   # Giao diện POS
│       │   ├── usePos.ts          # Hook quản lý toàn bộ state POS
│       │   ├── PosTableSelector.tsx  # Màn hình chọn bàn
│       │   ├── PosMenuGrid.tsx       # Lưới menu món ăn
│       │   ├── PosCartPanel.tsx      # Panel giỏ hàng + thanh toán
│       │   ├── PosTransferModal.tsx  # Modal chuyển bàn
│       │   └── index.ts
│       ├── profile/               # Dashboard cá nhân, StaffJobManager
│       └── restaurant/            # Merchant Hub components (menu, table, pos-terminal...)
│           └── pos-terminal/      # Quản lý thiết bị POS (RESTAURANT view)
│               ├── usePosTerminal.ts
│               └── PosTerminalManager.tsx
│
├── constants/
│   ├── labels.ts                  # ~130KB — TOÀN BỘ chuỗi UI tiếng Việt
│   ├── labels.en.ts               # ~109KB — Bản dịch tiếng Anh
│   ├── limits.constant.ts         # Giới hạn ký tự, số lượng
│   ├── location.constant.ts       # Danh sách tỉnh/thành phố Việt Nam
│   ├── gamification.constant.ts   # Level, XP config
│   └── excel.constant.ts          # Cấu hình import Excel
│
├── hooks/                         # 27 Custom hooks
│   ├── useAuth.ts                 # Wrapper Zustand auth (login, logout, user info)
│   ├── useAiChat.ts               # Quản lý state AI chat (17KB)
│   ├── useHomeActions.ts          # Actions trang chủ (like, follow, share...)
│   ├── useHomeData.ts             # Tải dữ liệu trang chủ
│   ├── useSocialActions.ts        # Actions mạng xã hội (14KB)
│   ├── useRestaurantActions.ts    # Actions Merchant Hub (10KB)
│   ├── useRestaurantProfile.ts    # Dữ liệu trang nhà hàng
│   ├── useProfileData.ts          # Dữ liệu hồ sơ cá nhân
│   ├── useSettings.ts             # Cài đặt tài khoản
│   ├── useGeolocation.ts          # Lấy vị trí GPS người dùng
│   ├── useNotifications.ts        # WebSocket notifications
│   ├── useMerchantFoodTable.ts    # Quản lý thực đơn
│   └── ...
│
├── services/                      # 20 API Service clients
│   ├── ai.service.ts              # /ai/* — Chat, Weather, Feedback, Conversations
│   ├── auth.service.ts            # /auth/* — Login, Register, Logout, OTP
│   ├── food.service.ts            # /foods/* — Tìm kiếm, gợi ý, yêu thích
│   ├── restaurant.service.ts      # /restaurants/* — Nhà hàng, nhân viên, từ chức
│   ├── pos-terminal.service.ts    # /pos-terminals/* — Đăng nhập POS, logs
│   ├── social.service.ts          # /posts/* — Bài viết, like, comment
│   ├── chat.service.ts            # /chat/* — Tin nhắn trực tiếp
│   ├── inventory.service.ts       # /inventory/* — Tồn kho
│   ├── voucher.service.ts         # /vouchers/* — Mã giảm giá
│   ├── order.service.ts           # /orders/* — Hóa đơn
│   ├── table.service.ts           # /tables/* — Bàn ăn
│   └── ...
│
├── store/                         # Zustand global state
│   ├── useAuthStore.ts            # User session (persist localStorage)
│   └── useToastStore.ts           # Toast notifications
│
├── lib/
│   └── api-client.ts              # HTTP Client (fetch wrapper, auto refresh token, error handling)
│
├── types/                         # TypeScript interfaces
│   ├── user.ts                    # User, UserRole enum
│   ├── restaurant.ts              # Restaurant, RestaurantProfile
│   └── ...
│
├── providers/
│   └── socket-provider.tsx        # WebSocket context (Socket.io client)
│
├── utils/
│   ├── formatters.ts              # formatCurrency, formatDate, formatNumber
│   └── helpers.ts                 # getValidImageUrl, truncate...
│
└── index.css                      # ~16KB — Design system toàn cục
                                   # CSS Variables, Typography, Components, Dark Mode
```

---

## DESIGN SYSTEM (Vanilla CSS)

File chính: `src/index.css`

| Token | Giá trị |
|-------|---------|
| **Primary** | `#f97316` (orange-500) |
| **Background sáng** | `#ffffff`, `#f9fafb`, `#f3f4f6` |
| **Background tối** | `#020617` (slate-950), `#0f172a`, `#1e293b` |
| **Border radius** | 24px (container) → 16px → 12px → 8px → 6px |
| **Shadow** | `shadow-sm` + border nhẹ (không dùng shadow nặng) |
| **Font** | Inter / System UI |
| **Emerald** | Trạng thái "Có sẵn / Free / Thành công" |
| **Amber** | Trạng thái "Cảnh báo / Sắp hết" |
| **Rose** | Hành động nguy hiểm (Xóa, Hủy) |

**Convention đặt tên class:**
- `.card-container` — Card lớn (border-radius 24px, border nhẹ, shadow-sm)
- `.btn-primary` — Nút chính màu primary
- `.text-primary` — Văn bản màu primary
- `.custom-scrollbar` — Scrollbar tùy chỉnh

---

## QUY TẮC CODE QUAN TRỌNG

1. **Không hardcode string** — Tất cả text UI phải dùng `LABELS.xxx` từ `constants/labels.ts`
2. **Không dùng `any`** — TypeScript strict mode
3. **Tất cả ảnh qua `SafeImage`** — Không dùng `next/image` trực tiếp
4. **Comment block đầu file** — Mô tả mục đích, file liên quan, design pattern
5. **Localization** — labels.ts (tiếng Việt) + labels.en.ts (tiếng Anh) luôn đồng bộ
6. **Magic values** → constants file
7. **Role check** → dùng `UserRole` enum, không hardcode string `'STAFF'`
8. **Auth** → `useAuth()` hook, không import store trực tiếp trong components

---

## CÁC FILE QUAN TRỌNG NHẤT

| File | Vai trò |
|------|---------|
| `backend/prisma/schema.prisma` | Toàn bộ DB schema (39 models, 768 dòng) |
| `backend/src/modules/ai/ai.service.ts` | AI pipeline orchestrator (~30KB) |
| `frontend/src/constants/labels.ts` | Toàn bộ UI strings tiếng Việt (~130KB) |
| `frontend/src/lib/api-client.ts` | HTTP client, auto refresh token, error handling |
| `frontend/src/index.css` | Design system toàn cục (~16KB) |
| `frontend/src/components/features/Navbar.tsx` | Navbar chính (~25KB) |
| `frontend/src/hooks/useAiChat.ts` | AI Chat state management (~18KB) |
| `backend/src/common/guards/custom-throttler.guard.ts` | Rate limiter toàn cục |
| `backend/src/common/redis/redis.service.ts` | Cache/Lock/Rate Limit service |
| `backend/src/modules/food/restaurant.service.ts` | Nghiệp vụ nhà hàng (~25KB) |
