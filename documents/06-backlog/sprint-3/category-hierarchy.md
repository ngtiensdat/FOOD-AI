# Sprint 3 – Tính năng Phân loại món ăn (cấp tối đa 4)

## Mục tiêu
- Cho phép **Merchant** tạo cấu trúc phân cấp **Nhóm → Danh mục → Phân loại → Cấp 4 (tùy chọn)**, tối đa **4 cấp**.
Ví dụ : (Đồ ăn -> Combo -> Combo 1 -> Món 1)
- Cấu trúc này **thuộc sở hữu riêng** của mỗi nhà hàng, không chia sẻ giữa các nhà hàng. 
- Chức năng này được Merchant tự quy định trong quá trình thêm món ăn ở form Thêm món ăn. Nghĩa là mỗi khi thêm món ăn, Merchant sẽ được chọn nhóm, danh mục, phân loại, cấp 4 (tùy chọn). Mặc định hiển thị sẽ là Danh sách các nhóm, ấn vào từng nhóm để xem các danh mục, ấn vào từng danh mục để xem các phân loại, ấn vào từng phân loại để xem các món ăn. Nếu merchant không có món ăn nào thì sẽ không hiển thị mục này.
- Vì sẽ có nhiều nhóm nhiều danh mục nhiều món ăn nên giao diện trên Trang công khai nhà hàng cần được bố trí thật logic, dễ nhìn
- Hiển thị đồng bộ trên **trang công khai của nhà hàng** (`/restaurant/[id]`) để khách hàng xem thực đơn theo cấp độ.
- Có nơi để quản lý phần này trong trang của merchant hub
- Chỉnh sửa lại form Đăng món ăn mới để đáp ứng được tính năng mới này, đồng thời thêm 1 nút để upload file excel (file excel này sẽ có nhiều món ăn được nhập sẵn với đầy đủ các trường và merchant chỉ việc chọn file excel lên là có thể đăng ). Ví dụ: upload file có 100 món, gồm đầy đủ các trường như tên,giá, tags, mô tả, link ảnh (Mỗi món là 1 dòng) và ở form Đăng món người dùng sẽ phải tự chọn đúng Cơ sở và Cấp tương ứng
## Quyết định của người dùng
- **Giới hạn độ sâu**: tối đa **4 cấp** (có thể dừng ở bất kỳ cấp nào).
- **Thứ tự**: thêm trường `order` (kiểu `Int`) cho `CategoryGroup` và `Category` để sắp xếp.
- **Chính sách xoá**: khi xoá một node cấp trên, **cascade** xoá toàn bộ các node con.
- **Phân trang API công khai**: mỗi cấp con trả **5 món ăn** mỗi trang, hỗ trợ query param `page`.

## Thay đổi cơ sở dữ liệu (Prisma)
```prisma
model CategoryGroup {
  id           Int        @id @default(autoincrement())
  name         String
  order        Int        @default(0)          // sắp xếp nhóm
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId Int
  categories   Category[]
  @@unique([restaurantId, name])
}

model Category {
  id           Int          @id @default(autoincrement())
  name         String
  order        Int        @default(0)          // sắp xếp danh mục/phân loại
  group        CategoryGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  groupId      Int
  parent       Category?   @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  parentId     Int?
  children     Category[]  @relation("CategoryHierarchy")
  foods        Food[]
  depth        Int          @default(1)          // mức độ (1‑nhóm, 2‑danh mục, 3‑phân loại, 4‑cấp 4)
  @@unique([groupId, name])
}

model Food {
  // các trường hiện có …
  categoryId   Int?
  category     Category? @relation(fields: [categoryId], references: [id])
}
```

## Backend (NestJS)
- **Module** `category` với các controller: `CategoryGroupController`, `CategoryController`.
- **DTOs**: `CreateGroupDto`, `UpdateGroupDto`, `CreateCategoryDto`, `UpdateCategoryDto` (có `order` và `depth`).
- **Guards**: `RolesGuard('RESTAURANT')` bảo vệ các endpoint merchant.
- **Endpoints** (`/merchant`):
  - `POST /groups` – tạo nhóm (có `order`).
  - `GET /groups` – danh sách nhóm của merchant.
  - `PUT /groups/:id`, `DELETE /groups/:id` (cascade).
  - `POST /categories` – tạo danh mục/phân loại, yêu cầu `groupId`, tùy chọn `parentId`, `depth`.
  - `GET /categories?groupId=` – lấy danh sách cấp con.
  - `PUT /categories/:id`, `DELETE /categories/:id` (cascade).
- **Public API** (`GET /public/restaurants/:id/foods`): thêm query params `groupId`, `categoryId`, `page` (default 1), `pageSize=5`. Trả về `{ items, total, page, pageSize }`.

## Frontend (Next.js)
### Merchant Hub (`restaurant-admin/page.tsx`)
- Thêm tab **Categories**.
- Thành phần UI: `CategoryGroupCard`, `CategoryCard` (hiển thị `order`).
- Modal/Form tạo‑sửa có trường `order`.
- (Tùy chọn) kéo‑thả để sắp xếp.

### Public Restaurant Page (`app/restaurant/[id]/page.tsx`)
- Gọi API mới, nhận dữ liệu phân trang.
- Render **accordion** hoặc **sidebar** hiển thị 4 cấp.
- Khi chọn node lá, hiển thị danh sách món ăn với **phân trang** 5 món/trang, nút “Next/Prev”.

## Migration & Seed
- Chạy `prisma migrate dev` để tạo bảng `CategoryGroup` và `Category` với các trường mới.
- (Tùy chọn) seed dữ liệu mẫu cho các nhà hàng hiện có.

## Kiểm thử
- **Unit/E2E** cho services và controllers (tạo, sửa, xoá, cascade).
- **Frontend** với React Testing Library: CRUD, sắp xếp `order`, pagination.
- Đảm bảo `npm run lint` không còn cảnh báo.

## Kiểm tra & Deploy
- **Automated tests**: `npm run test` cho backend và frontend.
- **Manual verification**:
  1. Merchant tạo tối đa 4 cấp, sắp xếp bằng `order`.
  2. Xóa nhóm → các node con biến mất.
  3. Truy cập trang công khai, duyệt thực đơn theo cấp, chuyển trang (5 món/trang).
- **Feature flag** `category_hierarchy` để bật dần.
