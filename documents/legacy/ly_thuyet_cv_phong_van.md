# TÀI LIỆU ÔN TẬP PHỎNG VẤN - LÝ THUYẾT & ĐỊNH NGHĨA TỪ CV

Tài liệu này định nghĩa và giải thích chi tiết các khái niệm, công nghệ, và mô hình thiết kế được đề cập trong CV của bạn. Hãy ôn tập kỹ tài liệu này trước các buổi phỏng vấn vị trí Fullstack/Backend (NestJS/Next.js).

---

## PHẦN MỞ ĐẦU: CẶP ĐÔI CÔNG NGHỆ CHỦ ĐẠO (NESTJS & NEXT.JS)

### 1. NestJS là gì? (Backend Framework)
* **Định nghĩa:** NestJS là một framework Node.js tiến tiến dùng để xây dựng các ứng dụng phía máy chủ (**Backend**) hiệu năng cao, dễ mở rộng. NestJS sử dụng TypeScript làm ngôn ngữ mặc định (nhưng vẫn hỗ trợ JS thuần).
* **Đặc điểm nổi bật:**
  * **Kiến trúc rõ ràng (Architecture):** Lấy cảm hứng mạnh mẽ từ Angular, tổ chức dự án bằng cấu trúc phân lớp nghiêm ngặt (Modules, Controllers, Providers/Services) giúp code gọn gàng, có tổ chức, dễ bảo trì cho các dự án lớn.
  * **Hỗ trợ OOP & SOLID:** Tích hợp sẵn cơ chế **Dependency Injection (DI)** cực kỳ mạnh mẽ giúp quản lý các phụ thuộc (dependencies) lỏng lẻo.
  * **Tương thích cao:** NestJS chạy trên nền Express (hoặc Fastify), cho phép tích hợp dễ dàng các thư viện khác (như Prisma, Throttler, Passport...).

### 2. Next.js là gì? (Frontend Framework)
* **Định nghĩa:** Next.js là một framework React mã nguồn mở do Vercel phát triển, dùng để xây dựng các ứng dụng giao diện người dùng (**Frontend**) có tốc độ tải nhanh và tối ưu hóa SEO.
* **Đặc điểm nổi bật:**
  * **Cơ chế Rendering linh hoạt:** Hỗ trợ render giao diện phía máy chủ (Server-Side Rendering - SSR), tạo trang tĩnh (Static Site Generation - SSG) và render phía Client (Client-Side Rendering - CSR) tùy thuộc vào mục đích sử dụng.
  * **App Router:** Cơ chế định tuyến dựa trên cấu trúc thư mục (File-system Routing) hiện đại nhất của Next.js (bắt đầu từ v13), hỗ trợ phân tách server component và client component rõ ràng.
  * **Tự động tối ưu hóa:** Hỗ trợ tối ưu hóa hình ảnh (`<Image />`), font chữ, mã nguồn (code-splitting) và tải trước tài nguyên (prefetching) tự động.

### 3. Tóm tắt sự khác biệt cốt lõi (Phân biệt NestJS vs Next.js)
| Đặc điểm | NestJS | Next.js |
| :--- | :--- | :--- |
| **Vai trò** | **Backend** (Xử lý logic, kết nối DB, API, bảo mật) | **Frontend** (Hiển thị giao diện, tương tác người dùng, SEO) |
| **Cơ sở nền tảng** | Node.js (thường chạy với Express/Fastify) | React |
| **Nơi thực thi** | Hoàn toàn chạy ở Server | Chạy ở cả Server (SSR) và Client (trình duyệt) |
| **Giao tiếp** | Cung cấp đầu mút API (REST API / GraphQL) | Gọi API từ Backend để lấy dữ liệu hiển thị lên UI |

---

## PHẦN 1: AI & TÌM KIẾM NGỮ NGHĨA (SEMANTIC SEARCH)

### 1. Vector Embedding là gì?
* **Định nghĩa:** Vector Embedding là quá trình chuyển đổi các dữ liệu phi cấu trúc (như văn bản, hình ảnh, âm thanh) thành các chuỗi số (vector) có số chiều cố định (ví dụ: 1536 chiều đối với mô hình của OpenAI).
* **Nguyên lý hoạt động:** Các từ hoặc đoạn văn có nghĩa tương đồng nhau trong không gian ngữ nghĩa sẽ được biểu diễn bởi các vector nằm gần nhau.
* **Ứng dụng trong dự án:** Chuyển đổi mô tả món ăn (ví dụ: *"Bún chả Hà Nội thơm ngon nóng hổi"*) và sở thích của người dùng thành các vector số để thực hiện so sánh.

### 2. Tiện ích mở rộng `pgvector` trong PostgreSQL là gì?
* **Định nghĩa:** `pgvector` là một extension (tiện ích mở rộng) mã nguồn mở dành cho hệ quản trị cơ sở dữ liệu PostgreSQL, cho phép lưu trữ, chỉ mục (indexing) và truy vấn các vector trực tiếp bằng SQL.
* **Tại sao sử dụng pgvector thay vì Vector DB chuyên dụng (như Pinecone, Milvus)?**
  * **Đơn giản hóa hạ tầng:** Không cần phải dựng thêm và quản lý một hệ thống cơ sở dữ liệu thứ hai, tránh phức tạp hóa hạ tầng mạng và chi phí.
  * **Đảm bảo tính nhất quán (ACID):** Cho phép kết hợp truy vấn vector với các truy vấn SQL thông thường (JOIN bảng, WHERE theo khoảng cách GPS, thời tiết) trong cùng một câu lệnh duy nhất một cách an toàn.

### 3. Khoảng cách Cosine (Cosine Similarity / Cosine Distance) là gì?
* **Định nghĩa:** Cosine Similarity đo góc giữa hai vector trong không gian nhiều chiều. Giá trị nằm trong khoảng từ -1 đến 1. Giá trị càng gần 1 tức là hai vector càng hướng về một phía (ngữ nghĩa càng giống nhau).
* **Công thức toán học:** 
  $$\text{Cosine Similarity} = \frac{A \cdot B}{\|A\| \|B\|}$$
* **Cosine Distance (Khoảng cách Cosine):** 
  $$\text{Cosine Distance} = 1 - \text{Cosine Similarity}$$
* **Ứng dụng trong SQL (pgvector):** Sử dụng toán tử `<=>` trong PostgreSQL để tính toán Cosine Distance. Truy vấn sắp xếp tăng dần theo khoảng cách này để tìm món ăn gần nhất với ngữ cảnh sở thích của khách hàng.

---

## PHẦN 2: CƠ SỞ DỮ LIỆU & KIẾN TRÚC HỆ THỐNG

### 1. Prisma ORM là gì? Ưu và nhược điểm?
* **Định nghĩa:** Prisma là một Object-Relational Mapping (ORM) thế hệ mới dành cho Node.js và TypeScript. Nó tự động tạo ra Prisma Client có kiểu dữ liệu an toàn (type-safe) dựa trên file định nghĩa `schema.prisma`.
* **Ưu điểm:**
  * **Type-safety tuyệt đối:** Tự động bắt lỗi sai kiểu dữ liệu ngay từ lúc viết code trong IDE.
  * **Prisma Schema trực quan:** Dễ đọc, tự động sinh quan hệ khóa ngoại và quản lý di cư (migrations) tốt.
  * **Tự động tối ưu truy vấn:** Tránh được phần nào lỗi N+1 Query nhờ cơ chế gom cụm truy vấn tự động (query batching).
* **Nhược điểm:** Hiệu năng truy vấn phức tạp hoặc lượng dữ liệu khổng lồ đôi khi chậm hơn SQL thuần do cơ chế biên dịch trung gian của Prisma Engine (viết bằng Rust).

### 2. Cấu trúc cây tự liên kết (Hierarchical Tree Self-Relation) là gì?
* **Định nghĩa:** Là mô hình thiết kế cơ sở dữ liệu trong đó một bảng có một quan hệ khóa ngoại trỏ ngược lại chính khóa chính của bảng đó (thường là cột `parentId` trỏ đến `id`).
* **Ứng dụng trong dự án:** Bảng `Category` (Danh mục món ăn) sử dụng Self-Relation để biểu diễn cấu trúc đa cấp: một danh mục cha (ví dụ: *Đồ uống*) chứa các danh mục con (ví dụ: *Trà sữa*, *Nước ép*).

### 3. Repository Pattern là gì? Tại sao cần áp dụng?
* **Định nghĩa:** Repository Pattern là mẫu thiết kế đóng vai trò làm trung gian giữa tầng Logic nghiệp vụ (Service) và tầng truy cập dữ liệu (ORM/Database).
* **Lý do áp dụng:**
  * **Tách biệt trách nhiệm (Decoupling):** Lớp Service không cần quan tâm cơ sở dữ liệu là PostgreSQL, MySQL hay MongoDB và cách ORM hoạt động ra sao. Nó chỉ gọi hàm từ Repository.
  * **Dễ viết Unit Test:** Có thể dễ dàng làm giả (mock) lớp Repository mà không cần kết nối tới cơ sở dữ liệu thật khi chạy test cho Service.
  * **Tránh trùng lặp mã nguồn:** Các câu lệnh truy vấn Prisma phức tạp được gom vào một nơi và tái sử dụng ở nhiều Service khác nhau.

### 4. Hệ thống nguyên lý SOLID trong thiết kế hướng đối tượng (OOP)

* **S - Single Responsibility Principle (Nguyên lý đơn nhiệm):**
  * *Định nghĩa:* Một lớp (Class) chỉ nên có một lý do duy nhất để thay đổi (chỉ làm một nhiệm vụ).
  * *Áp dụng:* Tách biệt các câu lệnh truy vấn dữ liệu khỏi Service và đưa vào các Repository tương ứng (`food.repository.ts`, `user.repository.ts`).
* **O - Open/Closed Principle (Nguyên lý Đóng/Mở):**
  * *Định nghĩa:* Đối tượng nên thoải mái cho việc mở rộng (extension) nhưng đóng đối với việc sửa đổi (modification).
  * *Áp dụng:* Thêm tính năng mới bằng cách kế thừa lớp hoặc viết thêm decorator thay vì sửa trực tiếp code lõi của thư viện/tính năng cũ.
* **L - Liskov Substitution Principle (Nguyên lý thay thế Liskov):**
  * *Định nghĩa:* Các đối tượng lớp con phải có thể thay thế các đối tượng lớp cha mà không làm thay đổi tính đúng đắn của chương trình.
  * *Áp dụng:* Lớp `CustomThrottlerGuard` kế thừa từ `ThrottlerGuard` của NestJS và có thể thay thế hoàn toàn vị trí của `ThrottlerGuard` trong `APP_GUARD` mà không làm hỏng ứng dụng.
* **I - Interface Segregation Principle (Nguyên lý phân tách giao diện):**
  * *Định nghĩa:* Không nên ép buộc một lớp phải triển khai các interface chứa các phương thức mà nó không sử dụng.
  * *Áp dụng:* Thiết kế các DTO (Data Transfer Object) nhỏ gọn, chuyên biệt thay vì dùng chung một DTO cồng kềnh cho nhiều API khác nhau.
* **D - Dependency Inversion Principle (Nguyên lý đảo ngược phụ thuộc):**
  * *Định nghĩa:* Các module cấp cao không nên phụ thuộc vào các module cấp thấp. Cả hai nên phụ thuộc vào các trừu tượng (interfaces/abstractions).
  * *Áp dụng:* NestJS sử dụng **Dependency Injection (DI)** để tự động tiêm (inject) các dependencies (như Repositories, Services) vào Controller thông qua Constructor, thay vì bắt Controller tự khởi tạo (`new Service()`).

---

## PHẦN 3: BẢO MẬT & VẬN HÀNH

### 1. Rate Limiting là gì? Tại sao cần áp dụng?
* **Định nghĩa:** Rate Limiting là kỹ thuật giới hạn số lượng yêu cầu (requests) mà một máy khách (client/IP/User) có thể gửi lên hệ thống trong một khoảng thời gian nhất định (ví dụ: tối đa 30 requests/phút).
* **Lý do áp dụng:**
  * Ngăn chặn các cuộc tấn công từ chối dịch vụ (DDoS) và brute force.
  * Tránh quá tải tài nguyên hệ thống.
  * Tiết kiệm chi phí vận hành khi tích hợp các API tính phí ngoài (như OpenAI API).

### 2. CustomThrottlerGuard hoạt động như thế nào trong dự án?
* **canActivate (Chặn lọc có chọn lọc):** Chỉ áp dụng giới hạn Rate Limiting cho các hành vi nhạy cảm dễ bị phá hoại hoặc tốn phí lớn bao gồm: Đăng nhập (`/auth/login`), Đăng ký (`/auth/register`), và Trò chuyện AI (`/ai/chat`). Tất cả các API thông thường khác đều được bỏ qua để tối ưu hiệu năng.
* **getTracker (Định danh thông minh):** 
  * Đối với đăng nhập: Sử dụng trường `email` của tài khoản đăng nhập làm khóa định danh (nếu người dùng cố tình nhập sai mật khẩu liên tục bằng một email, hệ thống sẽ khóa email đó tạm thời bất kể họ đổi IP).
  * Đối với các trường hợp khác: Sử dụng địa chỉ IP nguồn (`request.ip`) để định danh thực thể yêu cầu.
* **throwThrottlingException (Ghi đè ngoại lệ):** Trả về mã lỗi 429 kèm thông báo cụ thể cho từng loại lỗi (Ví dụ: *"Rất tiếc, AI đang bận. Bạn thử lại sau nhé!"* thay vì thông báo lỗi kỹ thuật mặc định).

---

## PHẦN 4: XỬ LÝ DỮ LIỆU LỚN & TRẢI NGHIỆM GIAO DIỆN (FRONTEND)

### 1. Pipeline xử lý file Excel dạng Buffer hoạt động thế nào? Lợi ích?
* **Nguyên lý hoạt động:** Thay vì tải tệp tin Excel lên ổ cứng của máy chủ (gây tốn dung lượng và chậm do I/O ổ đĩa), backend nhận tệp tin dưới dạng chuỗi nhị phân trong bộ nhớ RAM (**Buffer**) thông qua Multer. Sau đó, thư viện `xlsx` phân tích trực tiếp dữ liệu từ Buffer này, chuyển đổi thành mảng JSON và thực thi các câu lệnh thêm/cập nhật hàng loạt (bulk inserts/updates).
* **Lợi ích:**
  * **Tốc độ cực nhanh:** Đọc ghi trực tiếp trên RAM, bypass đĩa cứng.
  * **An toàn & Sạch sẽ:** Không để lại các tệp tin tạm rác trên ổ cứng máy chủ gây tràn đĩa.

### 2. Mô hình Orchestrator - Presentational Component là gì?
* **Định nghĩa:** Là mẫu thiết kế trong React/Next.js phân tách giao diện thành hai loại component:
  * **Orchestrator Component (hoặc Container Component):** Đóng vai trò quản lý logic, gọi API, kết nối với Custom Hooks (`useAiChat`) và điều phối trạng thái (state). Component này không chứa nhiều CSS hay giao diện hiển thị phức tạp (ví dụ: `AiChatWindow.tsx`).
  * **Presentational Component (Component hiển thị):** Chỉ nhận dữ liệu từ Orchestrator qua `props` và render giao diện HTML/CSS. Hoàn toàn không chứa logic nghiệp vụ hay gọi API trực tiếp (ví dụ: `ChatSidebar.tsx`, `ChatFeed.tsx`, `ChatInputForm.tsx`).
* **Lợi ích:** Dễ bảo trì, dễ viết kiểm thử giao diện, tăng tính tái sử dụng và chia sẻ công việc trong team dễ dàng.

### 3. Cơ chế hoạt động của component SafeImage và fallback image
* **Định nghĩa:** Một component bọc ngoài thẻ `<img />` hoặc `<Image />` của Next.js để kiểm soát lỗi đường dẫn ảnh chết (broken links).
* **Cơ chế hoạt động:** Sử dụng sự kiện `onError` của thẻ ảnh. Khi trình duyệt tải ảnh từ URL lỗi hoặc không tồn tại, sự kiện `onError` sẽ kích hoạt một hàm callback để cập nhật lại state của component (`hasError = true`). Khi state này thay đổi, component sẽ tự động render một ảnh mặc định (fallback image) hoặc một khung placeholder xám đẹp mắt thay vì để hiển thị biểu tượng ảnh lỗi màu trắng xấu xí của trình duyệt.
