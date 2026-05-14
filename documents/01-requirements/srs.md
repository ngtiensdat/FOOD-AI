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
