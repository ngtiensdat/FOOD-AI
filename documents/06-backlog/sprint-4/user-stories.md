# User Stories - Sprint 4

**Mục tiêu Sprint:** Tích hợp trí tuệ nhân tạo để cá nhân hóa trải nghiệm thông qua Onboarding và tìm kiếm thông minh bằng Vector (Hybrid Search).

---

## 1. Personalization (Cá nhân hóa)

### US-13: Hệ thống Onboarding (Sở thích người dùng)
- **As a** người dùng mới
- **I want** khai báo sở thích và mục tiêu sức khỏe trong lần đầu đăng nhập
- **So that** hệ thống đưa ra các gợi ý phù hợp nhất.

**Acceptance Criteria (AC):**
- [x] UI Modal Onboarding xuất hiện trong lần đầu tiên login.
- [x] Lưu các tùy chọn (Mục tiêu, Gu ẩm thực, Ngân sách) vào Profile.
- [x] Tự động cập nhật AI Embedding của người dùng sau khi Onboarding.

---

## 2. AI Intelligence (Trí tuệ nhân tạo)

### US-14: Tìm kiếm thông minh (AI Hybrid Search)
- **As a** người dùng
- **I want** tìm kiếm bằng ngôn ngữ tự nhiên và nhận gợi ý chính xác
- **So that** tôi không mất thời gian lọc món ăn thủ công.

**Acceptance Criteria (AC):**
- [x] Tích hợp OpenAI Embeddings cho toàn bộ dữ liệu món ăn và người dùng.
- [x] API Hybrid Search kết hợp Semantic Similarity và Metadata filtering.
- [x] Hiển thị các món ăn gợi ý từ AI trong phần Hero.

### US-15: Trợ lý AI (Chat Assistant)
- **As a** người dùng
- **I want** trò chuyện với AI để nhận tư vấn ăn uống
- **So that** tôi có một chuyên gia dinh dưỡng đồng hành.

**Acceptance Criteria (AC):**
- [x] API Chat kết nối OpenAI gpt-4o-mini với ngữ cảnh món ăn thực tế.
- [x] UI Chat Assistant (Floating button hoặc Chat page) toàn diện.
- [x] Gợi ý các món ăn cụ thể ngay trong nội dung trò chuyện của AI.
- [x] Lưu trữ và quản lý lịch sử trò chuyện lâu dài.

### US-15+: Phản hồi chất lượng gợi ý AI (AI Suggestion Feedback)
- **As a** người dùng sử dụng chatbot AI
- **I want** đánh giá thích (Like) hoặc không thích (Dislike) các món ăn được gợi ý
- **So that** hệ thống AI học hỏi và cải thiện thuật toán gợi ý chính xác hơn cho lần sau.

**Acceptance Criteria (AC):**
- [x] Nút bấm Like/Dislike bên cạnh mỗi thẻ món ăn gợi ý trong ô chat của AI.
- [x] API `/ai/feedback` ghi nhận phản hồi vào database (`AiFeedback`) để huấn luyện/tối ưu profile người dùng.

