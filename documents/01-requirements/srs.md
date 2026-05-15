# TÀI LIỆU DỰ ÁN WEB GỢI Ý MÓN ĂN BẰNG AI THÔNG MINH – FOOD AI

## I. Giới thiệu (Introduction)

### 1. Mục đích (Purpose)
Tài liệu này được xây dựng nhằm mô tả chi tiết các yêu cầu của hệ thống Food AI – một nền tảng web hỗ trợ người dùng tìm kiếm và gợi ý món ăn thông minh dựa trên công nghệ trí tuệ nhân tạo.

Mục tiêu của tài liệu là:
- Cung cấp cái nhìn tổng quan về hệ thống.
- Làm cơ sở để phân tích, thiết kế, phát triển và kiểm thử hệ thống.
- Đảm bảo các chức năng của hệ thống được xác định rõ ràng, đầy đủ và nhất quán.

Tài liệu này đóng vai trò như một nguồn tham chiếu chính trong suốt quá trình phát triển dự án.

### 2. Phạm vi hệ thống (Scope)
Hệ thống Food AI là một ứng dụng web cho phép người dùng tìm kiếm và nhận gợi ý món ăn thông qua việc nhập văn bản tự nhiên. Hệ thống sử dụng công nghệ AI (vector embedding và xử lý ngôn ngữ tự nhiên) để hiểu nhu cầu của người dùng và đưa ra các đề xuất phù hợp.

**Phạm vi của hệ thống bao gồm:**
- **Đối với khách hàng:**
  - Nhập yêu cầu bằng ngôn ngữ tự nhiên (ví dụ: “ăn gì cay cay gần đây”).
  - Tương tác với AI dưới dạng hội thoại.
  - Nhận gợi ý món ăn phù hợp dựa trên sở thích và ngữ cảnh.
  - Xem thông tin món ăn, nhà hàng và bài đăng.
- **Đối với nhà hàng (thương gia):**
  - Quản lý thông tin nhà hàng.
  - Đăng tải món ăn và bài viết quảng bá.
  - Theo dõi trạng thái của tài khoản.
- **Đối với quản trị viên (admin):**
  - Kiểm duyệt món ăn và bài đăng.
  - Quản lý và xử lý báo cáo.
  - Quản lý thương gia và người dùng.

*Hệ thống không bao gồm chức năng thanh toán hoặc giao hàng trong phạm vi hiện tại.*

### 3. Mục tiêu hệ thống (Objectives)
- **Cải thiện trải nghiệm người dùng:** Cho phép tìm kiếm món ăn tự nhiên qua hội thoại AI.
- **Cá nhân hóa đề xuất:** Sử dụng vector embedding để phân tích sở thích và đưa ra gợi ý phù hợp.
- **Hỗ trợ ra quyết định nhanh chóng:** Giúp người dùng chọn món dựa trên vị trí, thời gian, sở thích và ngân sách.
- **Tạo nền tảng quảng bá cho nhà hàng:** Cho phép các nhà hàng đăng tải nội dung tiếp cận khách hàng.
- **Ứng dụng công nghệ AI vào thực tế:** Xây dựng hệ thống gợi ý thông minh kết hợp NLP và Semantic Search.

---

## II. Mô tả tổng quan về dự án (Overall Description)

### 1. Kiến trúc hệ thống (System Architecture)

#### 1.1. Tổng quan kiến trúc
Hệ thống được thiết kế theo mô hình kiến trúc phân tầng (Layered Architecture), kết hợp giữa Web Application và AI Service.

Bao gồm 4 thành phần chính:
1. Frontend (Client Layer)
2. Backend (Application Layer)
3. AI Service Layer
4. Database (Data Layer)

#### 1.2. Frontend (Client Layer)
- **Công nghệ:** NextJS
- **Vai trò:** Cung cấp giao diện, thu thập dữ liệu người dùng, hiển thị gợi ý và tích hợp giao diện chat AI.

#### 1.3. Backend (Application Layer)
- **Công nghệ:** NestJS
- **Vai trò:** Xử lý logic nghiệp vụ, cung cấp RESTful API, quản lý xác thực/phân quyền và điều phối các dịch vụ AI.

#### 1.4. AI Service Layer (OpenAI API)
- **Vector Embedding:** Chuyển đổi mô tả món ăn, sở thích người dùng và hội thoại thành vector số để tìm kiếm ngữ nghĩa.
- **Conversational AI (Chat AI):** Phân tích ý định (intent), trích xuất thông tin, duy trì ngữ cảnh và phản hồi người dùng.

#### 1.5. Database (Data Layer)
- **Công nghệ:** PostgreSQL + extension `pgvector`.
- **Vai trò:** Lưu trữ dữ liệu hệ thống và các vector embedding để thực hiện Vector Search (gợi ý món ăn tương đồng).

### 2. Các yếu tố tác động đến hệ thống (System Constraints & Influences)
- **Kỹ thuật:** Yêu cầu Internet ổn định, trình duyệt hiện đại, xử lý bất đồng bộ (async).
- **AI:** Phụ thuộc vào API bên thứ ba (OpenAI), ảnh hưởng đến độ chính xác, tốc độ và chi phí.
- **Hiệu năng:** Cần tối ưu Index vector và Query top-K khi dữ liệu lớn.
- **Dữ liệu:** Chất lượng mô tả món ăn và thông tin người dùng ảnh hưởng trực tiếp đến AI.
- **Bảo mật:** Mã hóa mật khẩu và phân quyền rõ ràng (Admin, User, Merchant).

---

## III. Yêu cầu chức năng (Functional Requirements)

### 1. Chức năng không xác thực (Unauthenticated Users)
- Xem danh sách món ăn/nhà hàng/bài đăng.
- Xem mục "Món ăn đề xuất" do Admin đẩy lên top.
- Tìm kiếm cơ bản.

### 2. Chức năng dành cho Admin
- Quản lý người dùng và xử lý báo cáo.
- Duyệt bài đăng từ nhà hàng (Approve/Reject).
- Quản lý món ăn hệ thống và món ăn thương gia.
- Xác nhận các đề xuất AI ưu tiên (`isAdminRecommended`).

### 3. Chức năng dành cho Khách hàng (Customer)
- Đăng ký/Đăng nhập.
- **Chat với AI (RAG):** Chỉ gợi ý món ăn có trong cơ sở dữ liệu hệ thống.
- Nhận đề xuất cá nhân hóa, lưu yêu thích, đánh giá và xem lịch sử.

### 4. Chức năng dành cho Thương gia (Merchant)
- Quản lý thông tin nhà hàng và menu món ăn.
- Tạo/đăng bài viết và theo dõi trạng thái duyệt bài.
- Cập nhật trạng thái món ăn.

---

## IV. Yêu cầu phi chức năng (Non-functional Requirements)

### 1. Hiệu năng (Performance)
- **Thời gian phản hồi AI:** Chatbot phải phản hồi (stream hoặc câu trả lời đầy đủ) trong vòng tối đa 5-10 giây tùy thuộc vào độ phức tạp của yêu cầu.
- **Tối ưu hóa tìm kiếm:** Các truy vấn Vector Search trên `pgvector` phải đảm bảo phản hồi dưới 500ms đối với tập dữ liệu hàng chục nghìn bản ghi.
- **Tải trang:** Thời gian tải trang đầu tiên (First Contentful Paint) dưới 2 giây.

### 2. Bảo mật (Security)
- **Xác thực:** Sử dụng JWT (JSON Web Token) để quản lý phiên đăng nhập, lưu trữ an toàn trong HttpOnly Cookie.
- **Phân quyền (RBAC):** Đảm bảo người dùng chỉ truy cập được các tài nguyên thuộc quyền hạn của mình (Admin/Merchant/Customer).
- **Bảo mật dữ liệu:** Mã hóa mật khẩu người dùng bằng các thuật toán hiện đại (như bcrypt).

### 3. Tính khả dụng (Usability)
- **Giao diện:** Thân thiện, hỗ trợ tốt trên cả máy tính và thiết bị di động (Responsive Design).
- **Trải nghiệm AI:** Cung cấp các gợi ý mẫu để người dùng dễ dàng bắt đầu hội thoại với chatbot.

---

## V. Luồng xử lý chi tiết (Detailed Functional Flows)

### 1. Luồng gợi ý món ăn bằng AI (RAG Flow)
1.  **Nhận yêu cầu:** Người dùng gửi yêu cầu bằng ngôn ngữ tự nhiên qua giao diện chat.
2.  **Xử lý Vector:** Hệ thống chuyển yêu cầu thành Vector Embedding thông qua OpenAI API.
3.  **Tìm kiếm ngữ nghĩa (Semantic Search):** Hệ thống tìm kiếm các món ăn có vector tương đồng nhất trong database (PostgreSQL + pgvector).
4.  **Tạo ngữ cảnh (Contextualize):** Kết hợp yêu cầu của người dùng + danh sách món ăn tìm được + lịch sử trò chuyện.
5.  **Phản hồi:** Gửi ngữ cảnh cho AI để tạo ra câu trả lời tự nhiên, thân thiện và chính xác.

### 2. Quy trình kiểm duyệt bài đăng (Moderation Flow)
1.  Merchant tạo bài đăng -> Trạng thái bài đăng là `Pending`.
2.  Admin nhận thông báo bài đăng mới trong danh sách chờ.
3.  Admin kiểm tra nội dung (hình ảnh, ngôn từ) -> `Approve` (hiển thị công khai) hoặc `Reject` (kèm lý do).
4.  Hệ thống cập nhật trạng thái và thông báo cho Merchant.

---

## VI. Quản lý ngoại lệ (Exception Handling)

- **Lỗi dịch vụ AI:** Nếu OpenAI API gặp sự cố hoặc quá tải, hệ thống phải thông báo cho người dùng một cách khéo léo và chuyển sang chế độ tìm kiếm từ khóa truyền thống hoặc gợi ý món ăn phổ biến.
- **Không tìm thấy kết quả:** Khi AI không tìm thấy món ăn phù hợp, chatbot sẽ gợi ý các món ăn tương tự hoặc yêu cầu người dùng mở rộng tiêu chí tìm kiếm.
- **Lỗi kết nối database:** Hiển thị trang thông báo lỗi bảo trì để người dùng quay lại sau.

---

## VII. Thuật ngữ (Glossary)

- **RAG (Retrieval-Augmented Generation):** Quy trình kết hợp việc truy xuất dữ liệu từ nguồn tin cậy (Database) vào mô hình ngôn ngữ lớn để tạo ra câu trả lời chính xác và thực tế.
- **Vector Embedding:** Kỹ thuật chuyển đổi văn bản hoặc hình ảnh thành một dãy số để máy tính có thể hiểu và so sánh ý nghĩa.
- **pgvector:** Một phần mở rộng của PostgreSQL cho phép lưu trữ và tìm kiếm dữ liệu vector hiệu quả.
- **NLP (Natural Language Processing):** Xử lý ngôn ngữ tự nhiên, giúp máy tính hiểu được tiếng người.
