# Kế hoạch Di chuyển dữ liệu LocalStorage sang Database (Prisma & NestJS)

**Ngày cập nhật:** 11/06/2026
**Mục tiêu chính:** Đồng bộ và thay thế toàn bộ dữ liệu lưu trữ cục bộ (`localStorage`) của các phân hệ tính năng phía Client (Social Posts, Moderation Reports, Voucher Mall, Bug Reports, Promotions, Bookmarks, Notifications) bằng cơ sở dữ liệu PostgreSQL thực tế thông qua Prisma ORM và các API NestJS. Đảm bảo ánh xạ chuẩn xác 100% cấu trúc thực tế trên UI và không bỏ sót bất kỳ trường dữ liệu nào.

---

## 1. THAY ĐỔI CƠ SỞ DỮ LIỆU (PRISMA SCHEMA)

Bổ sung các mô hình và trường dữ liệu vào file [schema.prisma](file:///e:/FOOD_AI_code/my-web/backend/prisma/schema.prisma) để hỗ trợ lưu trữ thực tế:

### A. Cập nhật các Model hiện có

#### 1. Model `User` (Thêm các quan hệ)
```prisma
model User {
  id                Int            @id @default(autoincrement())
  // ... các trường hiện có
  bugReports        BugReport[]
  userVouchers      UserVoucher[]
  notifications     Notification[]
  savedPosts        SavedPost[]
}
```

#### 2. Model `Post` (Thêm các trường phục vụ tính năng Chia sẻ bài viết - Share)
```prisma
model Post {
  id               Int         @id @default(autoincrement())
  // ... các trường hiện có
  isShared         Boolean     @default(false) @map("is_shared")
  sharedFromPostId Int?        @map("shared_from_post_id")
  sharesCount      Int         @default(0) @map("shares_count")
  
  // Quan hệ tự liên kết (Self-relation) để truy vết bài đăng gốc được chia sẻ từ đâu
  sharedFromPost   Post?       @relation("PostShares", fields: [sharedFromPostId], references: [id], onDelete: SetNull)
  shares           Post[]      @relation("PostShares")
  
  savedPosts       SavedPost[]
  promotions       Promotion[]
}
```

#### 3. Model `Comment` (Thêm quan hệ tự liên kết phục vụ tính năng Trả lời - Reply)
```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  // ... các trường hiện có
  
  // Quan hệ tự liên kết phục vụ tính năng Phản hồi bình luận nhiều cấp (Replies)
  parentId  Int?      @map("parent_id")
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")
}
```

---

### B. Thêm các Model mới hoàn toàn

#### 1. Model `BugReport` (Báo lỗi kỹ thuật)
```prisma
enum BugCategory {
  AI
  UI
  PERFORMANCE
  OTHER
}

enum BugStatus {
  PENDING
  RESOLVED
  REJECTED
}

model BugReport {
  id          Int         @id @default(autoincrement())
  userId      Int         @map("user_id")
  category    BugCategory @default(UI)
  description String
  imageUrl    String?     @map("image_url")
  status      BugStatus   @default(PENDING)
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status])
  @@map("bug_reports")
}
```

#### 2. Model `Voucher` & `UserVoucher` (Hệ thống Tích điểm đổi quà)
```prisma
model Voucher {
  id            Int           @id @default(autoincrement())
  code          String        @unique
  title         String
  description   String?
  pointsCost    Int           @map("points_cost")
  discountValue String        @map("discount_value")
  minSpend      String        @map("min_spend")
  expiryDays    Int           @map("expiry_days")
  createdAt     DateTime      @default(now()) @map("created_at")
  userVouchers  UserVoucher[]

  @@map("vouchers")
}

model UserVoucher {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  voucherId  Int      @map("voucher_id")
  code       String   @unique // Mã voucher sinh kèm mã ngẫu nhiên duy nhất (Ví dụ: FOODAI15K-A1B2)
  redeemedAt DateTime @default(now()) @map("redeemed_at")
  used       Boolean  @default(false)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  voucher    Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)

  // CHÚ Ý: Không đặt @@unique([userId, voucherId]) để cho phép một người dùng đổi một loại voucher nhiều lần
  @@map("user_vouchers")
}
```

#### 3. Model `LevelBadgeConfig` (Cấu hình danh hiệu cấp độ thành viên động)
```prisma
model LevelBadgeConfig {
  id        Int      @id @default(autoincrement())
  role      UserRole @default(CUSTOMER)
  title     String
  points    Int
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([role, points]) // Đảm bảo mỗi vai trò không bị trùng mốc điểm
  @@map("level_badge_configs")
}
```

#### 4. Model `Notification` (Hệ thống thông báo Real-time chi tiết)
```prisma
enum NotificationType {
  LIKE
  COMMENT
  REPLY
  SHARE
  LEVEL_UP
  PROFILE_UPDATE
  SYSTEM
  WARNING
  PROMOTION
  MODERATION_REMOVE
  MODERATION_RESOLVE
  MODERATION_DISMISS
}

model Notification {
  id           Int              @id @default(autoincrement())
  userId       Int              @map("user_id") // ID người dùng nhận thông báo
  title        String
  content      String
  type         NotificationType @default(SYSTEM)
  isRead       Boolean          @default(false) @map("is_read")
  senderAvatar String?          @map("sender_avatar") // Lưu Avatar của người tương tác (hoặc ảnh hệ thống)
  createdAt    DateTime         @default(now()) @map("created_at")
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}
```

#### 5. Model `Promotion` (Quản lý ưu đãi & Combo quán ăn)
```prisma
enum PromoType {
  DISCOUNT
  COMBO
  GIFT
  OTHER
}

model Promotion {
  id             Int        @id @default(autoincrement())
  title          String
  description    String
  promoType      PromoType  @default(DISCOUNT) @map("promo_type")
  discountValue  String     @map("discount_value")
  restaurantId   Int        @map("restaurant_id")
  restaurantName String     @map("restaurant_name")
  image          String
  validUntil     DateTime   @map("valid_until")
  createdAt      DateTime   @default(now()) @map("created_at")
  restaurant     Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)

  @@index([restaurantId])
  @@map("promotions")
}
```

#### 6. Model `SavedPost` (Lưu trữ Bookmarks bài đăng)
```prisma
model SavedPost {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  postId    Int      @map("post_id")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("saved_posts")
}
```

---

## 2. TRIỂN KHAI API BACKEND (NESTJS)

Xây dựng/bổ sung các module, controller, service và repository tương ứng cho các phân hệ:

### A. Phân hệ Mạng xã hội (`SocialModule` - Post/Like/Comment/Share)
- **`GET /social/posts`**: Lấy danh sách bài viết công khai (hỗ trợ phân trang, quan hệ tác giả, bình luận + nested replies, và danh sách tài khoản thả tim `likedByUsers` phục vụ chuỗi thông báo).
- **`POST /social/posts`**: Đăng bài viết mới (NORMAL/REVIEW). Tự động tích lũy `+50` điểm và đồng bộ kiểm tra thăng cấp/danh hiệu trong database transaction.
- **`POST /social/posts/:id/like`**: Thả tim/Bỏ thả tim. Cộng `+5` điểm khi like, đồng thời tạo bản ghi `Notification` (gửi kèm `senderAvatar`) tới tác giả bài viết.
- **`POST /social/posts/:id/comment`**: Thêm bình luận mới. Cộng `+10` điểm, gửi thông báo tới tác giả.
- **`POST /social/posts/:id/reply/:commentId`**: Trả lời bình luận (Nested comment). Cộng `+5` điểm, gửi thông báo tới chủ bình luận gốc.
- **`POST /social/posts/:id/share`**: Chia sẻ bài viết. Nhân bản bài viết với flag `isShared: true`, liên kết `sharedFromPostId`, cộng `+15` điểm cho người chia sẻ và tạo thông báo gửi tới tác giả bài đăng gốc.
- **`DELETE /social/posts/:id`**: Xóa bài đăng (kiểm tra quyền chủ sở hữu hoặc ADMIN).
- **`DELETE /social/comments/:id`**: Xóa bình luận/phản hồi (kiểm tra quyền chủ bình luận hoặc chủ bài đăng).

### B. Phân hệ Voucher & Tích điểm (`LoyaltyModule`)
- **`GET /loyalty/vouchers`**: Lấy danh sách voucher trong hệ thống.
- **`GET /loyalty/my-vouchers`**: Lấy danh sách các voucher đã đổi của tài khoản hiện tại.
- **`POST /loyalty/redeem`**: Đổi voucher bằng điểm thưởng:
  1. Kiểm tra số dư điểm (`User.points >= Voucher.pointsCost`).
  2. Trừ điểm người dùng.
  3. Tạo bản ghi `UserVoucher` với code ngẫu nhiên duy nhất.

### C. Phân hệ Ưu đãi & Khuyến mãi (`PromotionModule`)
- **`GET /promotions`**: Lấy danh sách khuyến mãi của các nhà hàng (hỗ trợ lọc theo loại: DISCOUNT/COMBO/GIFT/OTHER).
- **`POST /promotions`**: Thương gia (role `RESTAURANT`) đăng tin ưu đãi mới kèm hình ảnh đại diện, giá trị ưu đãi và ngày hết hạn.

### D. Phân hệ Lưu bài viết (`BookmarkModule`)
- **`GET /bookmarks`**: Lấy danh sách bài viết đã bookmark của người dùng.
- **`POST /bookmarks/toggle`**: Ghim/Bỏ ghim lưu bài viết.

### E. Phân hệ Báo lỗi kỹ thuật (`BugReportModule`)
- **`POST /bug-reports`**: Nhận phản hồi báo lỗi (Category: AI/UI/PERFORMANCE/OTHER) và lưu trữ.

### F. Phân hệ Quản lý Cấu hình Danh hiệu (`LevelBadgeModule`)
- **`GET /level-badges`**: Lấy danh sách mốc điểm/danh hiệu phục vụ hiển thị & cập nhật.
- **`POST /level-badges`** (Admin): Thêm/cập nhật mốc điểm danh hiệu.
- **`DELETE /level-badges/:id`** (Admin): Xóa mốc danh hiệu.

### G. Phân hệ Báo cáo & Kiểm duyệt (`ReportModule`)
- **`POST /reports`**: Gửi báo cáo vi phạm nội dung.
- **`GET /reports/pending`** (Admin): Lấy danh sách hàng chờ xử lý.
- **`PATCH /reports/:id/resolve`** (Admin): Phê duyệt xóa nội dung vi phạm, tự động xóa bài đăng/bình luận tương ứng và gửi thông báo kết quả cho người báo cáo lẫn tác giả vi phạm.

---

## 3. TÍCH HỢP FRONTEND (NEXT.JS)

Thay thế các cuộc gọi `localStorage` trong frontend bằng các API Service thực tế:
1. **`social.service.ts`**: Tải bài viết, thực hiện like, comment, reply, share và xóa thông qua API backend.
2. **`loyalty.service.ts`**: Tải chợ voucher, thực hiện trừ điểm và lưu lịch sử quy đổi trên DB.
3. **`promotion.service.ts`**: Thương gia đăng bài và lọc tin khuyến mãi từ database.
4. **`bookmark.service.ts`**: Ghim lưu bài viết động.
5. **`bug-report.service.ts`**: Gửi báo cáo lỗi trực tiếp về server.
6. **`notification.service.ts`**: Đọc/xóa thông báo, cập nhật số lượng thông báo chưa đọc (badge) qua WebSocket hoặc Long Polling.

---

## 4. KẾ HOẠCH XÁC MINH (VERIFICATION PLAN)

1. **Database push & Seed:**
   - Chạy lệnh `npx prisma db push` để tạo/cập nhật các bảng mới trong cơ sở dữ liệu Postgres.
   - Chạy tập lệnh seed để tạo các voucher mặc định (`FOODAI15K`, `FOODAI30K`, `FOODAI50K`, `FREESHIPAI`) và cấu hình danh hiệu mặc định trong DB.
2. **Build Success:**
   - Biên dịch TypeScript cả frontend (`npm run build`) và backend để xác nhận không lỗi kiểu dữ liệu.
3. **End-to-End Tests:**
   - Đăng nhập khách hàng: Đăng bài, Like bài viết khác, Viết bình luận, Trả lời bình luận -> Xác nhận điểm XP tăng thực tế trên database, danh hiệu tự động cập nhật và xuất hiện thông báo real-time.
   - Đăng nhập thương gia: Đăng tin khuyến mãi -> kiểm tra tin hiển thị trên tab Ưu đãi chung.
   - Đăng nhập Admin: Kiểm duyệt các báo cáo vi phạm, gửi thông báo hệ thống diện rộng -> Xác nhận dữ liệu bị gỡ thực tế và thông báo được gửi thành công đến tài khoản đích.
