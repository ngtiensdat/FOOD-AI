# Specification: Merchant Posts & Reviews List (Sprint 5)

Tài liệu này đặc tả chi tiết thiết kế kỹ thuật cho tính năng **Hiển thị danh sách bài đăng và đánh giá của khách hàng về nhà hàng trên profile của Thương gia**, thuộc phạm vi **Sprint 5: Social Feed & Interaction**.

---

## 1. Xác định vị trí trong Sprint Backlog

Tính năng này thuộc **Sprint 5** (Hệ thống Mạng xã hội & Tương tác bài đăng):
* Tương quan trực tiếp với:
  * **[Backend] Task 1.3**: API lấy danh sách bài viết (Feed) theo thời gian / địa điểm.
  * **[Frontend] Task 1.5 & 1.6**: Component hiển thị bài đăng và trang Feed hiển thị toàn bộ bài đăng cộng đồng.
* **Mục tiêu mở rộng**: Cung cấp cho chủ nhà hàng (Merchant) khả năng quản lý và theo dõi các phản hồi, bài đánh giá (Reviews) có gắn thẻ (`restaurantId`) liên quan đến cửa hàng của họ.

---

## 2. Thiết kế Cơ sở dữ liệu (Prisma Schema)

Sử dụng mối quan hệ giữa bảng `Post` và `Restaurant` thông qua khóa ngoại `restaurantId`:
```prisma
model Post {
  id           Int        @id @default(autoincrement())
  authorId     Int        @map("author_id")
  restaurantId Int?       @map("restaurant_id")
  foodId       Int?       @map("food_id")
  title        String?
  content      String?
  image        String?
  rating       Int?       // Thang điểm đánh giá 1-5 sao
  status       PostStatus @default(APPROVED) // PENDING, APPROVED, REJECTED
  createdAt    DateTime   @default(now()) @map("created_at")

  author       User       @relation("UserPosts", fields: [authorId], references: [id], onDelete: Cascade)
  restaurant   Restaurant? @relation(fields: [restaurantId], references: [id], onDelete: SetNull)
}
```

---

## 3. Thiết kế API Backend (NestJS)

Các API này sẽ được định cấu trúc trong **`PostModule`** (sẽ được khởi tạo trong Sprint 5).

### 3.1. API Lấy danh sách bài viết thuộc nhà hàng (Dành cho Merchant)
* **Endpoint**: `GET /restaurants/my-restaurant/posts`
* **Xác thực**: `JwtAuthGuard` + `RolesGuard(RESTAURANT)`.
* **Tham số truy vấn (Query Params)**:
  * `page` (default: 1): Số trang.
  * `limit` (default: 10): Số bản ghi trên mỗi trang.
* **Mô tả**: Trả về tất cả các bài đăng (cả PENDING, APPROVED) có liên kết với nhà hàng của chủ sở hữu đang đăng nhập.
* **Mã phản hồi thành công**: `200 OK`
  ```json
  {
    "data": [
      {
        "id": 45,
        "title": "Trải nghiệm tuyệt vời!",
        "content": "Bánh pizza ở đây rất giòn ngon, nhân viên phục vụ tận tình.",
        "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591",
        "rating": 5,
        "status": "APPROVED",
        "createdAt": "2026-05-19T07:15:30Z",
        "author": {
          "id": 12,
          "name": "Trần Văn B",
          "profile": {
            "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
          }
        }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### 3.2. API Lấy danh sách bài viết của nhà hàng (Public - Dành cho Khách hàng)
* **Endpoint**: `GET /restaurants/:id/posts`
* **Xác thực**: Không yêu cầu (Public).
* **Mô tả**: Trả về các bài đăng/đánh giá **đã được duyệt (`status = APPROVED`)** của nhà hàng có ID tương ứng để hiển thị trên trang Profile công khai của nhà hàng.

---

## 4. Thiết kế Frontend (Next.js)

### 4.1. Tích hợp API Client
* **File**: `my-web/frontend/src/services/post.service.ts` *(Tạo mới trong Sprint 5)*
* **Hàm**:
  * `getMerchantPosts(query: { page: number; limit: number })`
  * `getPublicRestaurantPosts(restaurantId: number, query: { page: number; limit: number })`

### 4.2. Giao diện Tab "Bài viết" tại Merchant Dashboard
* **Vị trí**: Nằm trong cụm Tabs quản lý của Merchant Hub (cạnh tab Quản lý thực đơn).
* **Thành phần hiển thị**:
  * **Bộ lọc**: Lọc bài đăng theo Số sao đánh giá (1-5 sao) hoặc theo Trạng thái duyệt bài (Tất cả, Đã duyệt, Đang chờ duyệt).
  * **Danh sách Feed**: Mỗi bài viết hiển thị theo dạng Card sạch đẹp, bao gồm:
    * Avatar + Tên khách hàng (Khớp với `author`).
    * Điểm số đánh giá (Sao vàng).
    * Tiêu đề và nội dung phản hồi chi tiết.
    * Hình ảnh đính kèm của khách hàng (nếu có, dạng gallery ảnh nhỏ có thể zoom).
    * Ngày giờ tạo.
  * **Phân trang**: Cơ chế "Tải thêm" (Load More) thân thiện với thiết bị di động.

---

## 5. Quy chuẩn Thiết kế Giao diện (Aesthetic & Light/Dark Mode)

Giao diện quản lý đánh giá của khách hàng phải hiển thị đồng nhất ở cả hai chế độ màu, đảm bảo trải nghiệm premium và khả năng đọc tốt (readability):

* **Bộ lọc đánh giá (Filter Chips)**:
  * *Light mode*: Nền trắng xám nhẹ (`bg-gray-100/60`), chữ màu xám sẫm, khi active chuyển sang màu cam thương hiệu (`bg-primary text-white`).
  * *Dark mode*: Nền kính tối mờ (`dark:bg-slate-900/40`), khi active chuyển sang màu cam dịu (`dark:bg-orange-600/90 dark:text-slate-100`).
* **Card Đánh giá (Review Card)**:
  * *Light mode*: Nền trắng tinh khiết, viền xám cực mỏng (`bg-white border border-gray-100 shadow-sm`).
  * *Dark mode*: Nền kính tối mờ (Glassmorphism) chống lóa (`dark:bg-slate-950/40 dark:border-slate-900 dark:backdrop-blur-md`).
* **Định dạng Text (Tiêu đề & Nội dung)**:
  * *Light mode*: Chữ xám đậm (`text-gray-800` cho tiêu đề, `text-gray-600` cho nội dung).
  * *Dark mode*: Chữ xám sáng (`dark:text-slate-200` cho tiêu đề, `dark:text-slate-400` cho nội dung).
* **Sao Đánh giá (Rating Stars)**:
  * Sử dụng màu vàng hổ phách tươi sáng ở cả hai chế độ để làm nổi bật đánh giá tích cực (`text-amber-400` hoặc `text-yellow-400`).

