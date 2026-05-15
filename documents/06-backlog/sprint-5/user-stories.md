# User Stories - Sprint 5

**Mục tiêu Sprint:** Chuyển đổi ứng dụng thành một mạng xã hội thực thụ với các tính năng đăng bài review, tương tác Like/Comment và hệ thống thông báo thời gian thực.

---

## 1. Social Post System (Hệ thống Bài đăng)

### US-17: Đăng bài viết Review
- **As a** người dùng
- **I want** đăng bài review kèm hình ảnh và nội dung về món ăn hoặc quán ăn
- **So that** tôi có thể chia sẻ trải nghiệm với cộng đồng.

**Acceptance Criteria (AC):**
- [ ] Form đăng bài: Cho phép upload nhiều ảnh, viết nội dung text.
- [ ] Bài viết hiển thị trên Feed (Trang chủ) và Trang cá nhân của người dùng.
- [ ] Gắn tag món ăn hoặc quán ăn vào bài viết.

---

## 2. Interaction & Notifications (Tương tác & Thông báo)

### US-18: Tương tác Bài viết (Like/Comment)
- **As a** người dùng
- **I want** thích (Like) và bình luận vào bài viết của người khác
- **So that** tăng tính tương tác xã hội.

**Acceptance Criteria (AC):**
- [ ] Nút Like và hiển thị số lượng người thích.
- [ ] Danh sách bình luận dưới mỗi bài viết.

### US-19: Thả tim món ăn (Food Card Likes)
- **As a** người dùng
- **I want** thả tim các món ăn cụ thể trên trang Explore/Home
- **So that** món ăn đó tăng độ phổ biến và AI hiểu gu của tôi hơn.

**Acceptance Criteria (AC):**
- [ ] Hiển thị tổng lượt tim trên thẻ món ăn.
- [ ] Lưu trạng thái người dùng đã thả tim vào Database.

### US-20: Hệ thống Thông báo (Notifications)
- **As a** người dùng
- **I want** nhận thông báo khi có người tương tác với bài viết của mình
- **So that** tôi có thể phản hồi kịp thời.

**Acceptance Criteria (AC):**
- [ ] Thông báo Real-time khi được Like/Comment.
- [ ] Tab thông báo hiển thị danh sách các hoạt động mới nhất.
