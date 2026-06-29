# Kế hoạch Triển khai Chi tiết: Hệ thống Đề xuất Bài viết Cá nhân hóa sử dụng LangChain & pgvector

Tài liệu này hướng dẫn chi tiết các bước thiết lập, lập trình và kiểm thử hệ thống đề xuất bài đăng (Social Feed) thông minh dựa trên độ tương đồng ngữ nghĩa giữa hồ sơ người dùng (User Profile Vector) và nội dung bài đăng (Post Vector).

---

## 1. Mục Tiêu & Cơ Chế Hoạt Động
* **Mục tiêu**: Đề xuất các bài viết trên mạng xã hội dựa trên **độ tương thích sở thích cao nhất** của thực khách. Hệ thống tự động phân tích và đưa lên đầu các nội dung phù hợp với xu hướng ẩm thực của người dùng (ví dụ: món cay, đồ ngọt, quán bình dân, món chay, ẩm thực Nhật/Hàn, v.v.) mà không phụ thuộc cứng vào cơ chế follow truyền thống.
* **Cơ chế**:
  1. Khi một **Bài viết (Post)** được tạo hoặc chỉnh sửa, hệ thống sẽ gom thông tin (Tiêu đề, nội dung, món ăn liên quan, nhà hàng liên quan) thành một mô tả văn bản, dùng **LangChain OpenAI Embeddings** chuyển hóa thành Vector 1536 chiều và lưu vào PostgreSQL qua `pgvector`.

  2. Khi người dùng truy cập bảng tin, hệ thống lấy Vector sở thích của họ (`UserProfile.embedding`) thực hiện so khớp độ tương đồng Cosine (`<=>` operator trong SQL) với tất cả `Post.embedding` để lấy các bài đăng phù hợp nhất xếp lên đầu bảng tin.

---

## 2. Các Bước Vận Hành Chi Tiết (TODO List)

### [ ] BƯỚC 1: Cập nhật Schema Cơ sở dữ liệu (Database Schema)
* **File cần sửa**: `my-web/backend/prisma/schema.prisma`
* **Nội dung thay đổi**:
  Tìm model `Post` và thêm cột `embedding` như dưới đây:
  ```prisma
  model Post {
    id           Int         @id @default(autoincrement())
    // ... (các trường cũ)
    embedding    Unsupported("vector")?
    // ... (các trường cũ)
  }
  ```
* **Câu lệnh cần chạy sau khi sửa**:
  Mở terminal tại thư mục `my-web/backend` và thực hiện:
  ```bash
  # Cập nhật cấu trúc bảng trong PostgreSQL
  npx prisma db push
  
  # Tạo lại Prisma client trong node_modules
  npx prisma generate
  ```

---

### [ ] BƯỚC 2: Phát triển Tầng Dữ liệu (VectorRepository)
* **File cần sửa**: `my-web/backend/src/modules/ai/vector.repository.ts`
* **Nội dung cần thêm**:
  1. Hàm cập nhật Vector cho bài đăng:
     ```typescript
     async updatePostEmbedding(postId: number, vector: number[]) {
       const vectorStr = `[${vector.join(',')}]`;
       return this.prisma.$executeRaw`
         UPDATE posts SET embedding = CAST(${vectorStr} AS vector) WHERE id = ${postId}
       `;
     }
     ```
  2. Hàm tìm kiếm danh sách bài viết tương đồng cosine với vector người dùng:
     ```typescript
     async getRecommendedPostIds(userVector: number[], limit = 10, offset = 0): Promise<number[]> {
       const vectorStr = `[${vector.join(',')}]`;
       
       interface RecommendedPostRow {
         id: number;
         similarity: number;
       }
       
       const rows = await this.prisma.$queryRaw<RecommendedPostRow[]>`
         SELECT id, 
                (1 - (embedding <=> CAST(${vectorStr} AS vector))) as similarity 
         FROM posts 
         WHERE deleted_at IS NULL 
           AND status::text = 'APPROVED' 
           AND embedding IS NOT NULL
         ORDER BY similarity DESC 
         LIMIT ${limit}
         OFFSET ${offset}
       `;
       
       return rows.map(r => r.id);
     }
     ```

---

### [ ] BƯỚC 3: Đồng Bộ Hóa Vector (VectorSyncService)
* **File cần sửa**: `my-web/backend/src/modules/ai/services/vector-sync.service.ts`
* **Nội dung cần thêm**:
  Hàm `updatePostEmbedding(postId: number)` sử dụng kỹ thuật Retry tự động:
  ```typescript
  async updatePostEmbedding(postId: number) {
    try {
      await retry(
        async () => {
          const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
              author: true,
              food: { include: { category: true } },
              restaurant: true
            }
          });
          
          if (!post || post.deletedAt) return;
          
          const authorName = post.author.name || 'Người dùng';
          const titleStr = post.title ? `Tiêu đề: ${post.title}. ` : '';
          const contentStr = post.content ? `Nội dung: ${post.content}. ` : '';
          const foodStr = post.food 
            ? `Món ăn liên quan: ${post.food.name} (${post.food.category?.name || ''}). Mô tả món: ${post.food.description || ''}. `
            : '';
          const restaurantStr = post.restaurant
            ? `Nhà hàng liên kết: ${post.restaurant.name}. Địa chỉ: ${post.restaurant.address}. Lĩnh vực ẩm thực: ${post.restaurant.cuisines?.join(', ') || ''}.`
            : '';
            
          // Tạo chuỗi văn bản hoàn chỉnh biểu diễn bài đăng
          const textToEmbed = `Bài viết ẩm thực của tác giả ${authorName}. ${titleStr}${contentStr}${foodStr}${restaurantStr}`;
          
          // Lấy vector từ OpenAI/LangChain
          const embedding = await this.getEmbedding(textToEmbed);
          
          // Lưu vào database
          await this.vectorRepository.updatePostEmbedding(postId, embedding);
        },
        3, // 3 lần thử lại nếu thất bại
        500, // delay 500ms
        2 // exponential backoff
      );
      this.logger.log(`Cập nhật vector thành công cho bài đăng ID: ${postId}`);
    } catch (error) {
      this.logger.error(
        `Lỗi cập nhật vector cho bài đăng ${postId} sau 3 lần thử lại:`,
        error instanceof Error ? error.stack : error
      );
      // Ghi nhận vào hàng đợi lỗi nếu cần (DLQ)
      await this.retryQueueService.pushToQueue('post', postId).catch((qErr) => {
        this.logger.error(`Không thể đưa bài đăng ${postId} vào DLQ:`, qErr);
      });
    }
  }
  ```
  *Lưu ý: Bổ sung xử lý job `'post'` trong hàm `onModuleInit` của `AiService` nếu đẩy vào `RetryQueueService`.*

---

### [ ] BƯỚC 4: Tích Hợp Module & Cập Nhật Nghiệp Vụ PostService
* **File cần sửa 1**: `my-web/backend/src/modules/social/social.module.ts`
  - Thêm `AiModule` vào mảng `imports` của `@Module`:
    ```typescript
    imports: [PrismaModule, CommonCacheModule, NotificationModule, BadgeModule, AiModule],
    ```

* **File cần sửa 2**: `my-web/backend/src/modules/social/post.service.ts`
  - Inject `VectorSyncService` và `VectorRepository` vào constructor:
    ```typescript
    constructor(
      private prisma: PrismaService,
      private cacheService: CacheService,
      private readonly notificationGateway: NotificationGateway,
      private readonly gamificationQueue: GamificationQueueService,
      private readonly vectorSyncService: VectorSyncService,
      private readonly vectorRepository: VectorRepository,
    ) {}
    ```
  - **Kích hoạt sinh vector khi tạo / sửa bài**:
    - Trong hàm `createPost(...)`: Sau khi tạo bài đăng, gọi `this.vectorSyncService.updatePostEmbedding(post.id)` để sinh vector ngầm.
    - Trong hàm `updatePost(...)`: Gọi `this.vectorSyncService.updatePostEmbedding(updatedPost.id)` sau khi cập nhật thành công.
  - **Thay đổi logic tìm kiếm bảng tin `getAllPosts(...)`**:
    - Khi có `viewerId` (người dùng đang xem) và KHÔNG yêu cầu lọc theo `authorId` cụ thể:
      1. Truy vấn `UserProfile` của `viewerId` để lấy trường `embedding`.
      2. Nếu người dùng đã có `embedding` (do đã hoàn tất onboarding preferences hoặc hoạt động tương tác trước đó):
         - Gọi `this.vectorRepository.getRecommendedPostIds(userEmbedding, pageLimit, offset)` để lấy danh sách IDs bài đăng phù hợp nhất.
         - Thực hiện truy vấn `prisma.post.findMany` kèm theo điều kiện lọc `where: { id: { in: recommendedIds } }`.
         - Sắp xếp thủ công kết quả trả về đúng theo thứ tự độ tương đồng của danh sách IDs gợi ý.
      3. Nếu không có `viewerId` hoặc `userProfile.embedding` rỗng: Giữ nguyên câu lệnh query Prisma sắp xếp theo thời gian mặc định (`orderBy: { createdAt: 'desc' }`).

---

## 3. Quy Trình Kiểm Thử & Xác Thực (Verification Workflow)

### [ ] 1. Script Kiểm Thử Tự Động (Backend)
Tạo file kiểm thử tại `my-web/backend/src/scripts/test-post-recommendation.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PostService } from '../modules/social/post.service';
import { VectorSyncService } from '../modules/ai/services/vector-sync.service';
import { PrismaService } from '../database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const postService = app.get(PostService);
  const vectorSync = app.get(VectorSyncService);

  console.log('=== KHỞI CHẠY KIỂM THỬ GỢI Ý BÀI VIẾT BẰNG VECTOR ===');

  // 1. Tạo dữ liệu giả lập bài đăng
  const vegPost = await postService.createPost(1, {
    title: 'Cách làm đậu hũ sốt cà chua chay',
    content: 'Món chay thanh đạm từ đậu phụ non, cà chua tươi và nấm đông cô, tốt cho sức khỏe.'
  });
  const meatPost = await postService.createPost(1, {
    title: 'Bí quyết ướp sườn nướng tảng khổng lồ',
    content: 'Cách nướng sườn heo nhiều thịt đẫm sốt BBQ đậm đà, thích hợp cho tiệc BBQ ngoài trời.'
  });

  // 2. Chờ sinh vector
  await vectorSync.updatePostEmbedding(vegPost.id);
  await vectorSync.updatePostEmbedding(meatPost.id);

  // 3. Cập nhật vector sở thích người dùng (User 2 thích ăn chay)
  const vegUserEmbeddingText = "Người dùng thích ăn chay thanh tịnh, các món rau củ, đậu hũ nấm và ghét ăn thịt động vật.";
  const vegUserEmbedding = await vectorSync.getEmbedding(vegUserEmbeddingText);
  await prisma.$executeRaw`
    UPDATE user_profiles SET embedding = CAST(${`[${vegUserEmbedding.join(',')}]`} AS vector) WHERE user_id = 2
  `;

  // 4. Lấy bảng tin đề xuất cho User 2
  const feed = await postService.getAllPosts(2, undefined, 1, 10, true);
  console.log('Kết quả Bảng tin gợi ý (Vị trí số 1 phải là món chay):');
  feed.data.forEach((post, index) => {
    console.log(`${index + 1}. ${post.title} (ID: ${post.id})`);
  });

  await app.close();
}

bootstrap();
```
Chạy script bằng lệnh:
```bash
npx ts-node src/scripts/test-post-recommendation.ts
```

### [ ] 2. Kiểm thử thủ công trên Giao diện (Frontend)
1. Đăng nhập bằng tài khoản Thực khách và chuyển đổi sở thích ăn uống trong Onboarding/Profile settings sang một gu ẩm thực bất kỳ (ví dụ: **Món cay**, **Đồ ngọt**, hoặc **Món Hàn/Nhật**).
2. Truy cập bảng tin trang chủ, xác nhận các bài viết liên quan đến gu ẩm thực đã cấu hình xuất hiện nổi bật hơn các chủ đề ẩm thực khác.

