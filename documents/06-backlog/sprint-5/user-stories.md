# User Stories - Sprint 5

**Mục tiêu Sprint:** Chuyển đổi ứng dụng thành một mạng xã hội thực thụ với các tính năng đăng bài review, tương tác Like/Comment và hệ thống thông báo thời gian thực.

---

## 1. Social Post System (Hệ thống Bài đăng)

### US-17: Đăng bài viết Review
- **As a** người dùng
- **I want** đăng bài review kèm hình ảnh và nội dung về món ăn hoặc quán ăn
- **So that** tôi có thể chia sẻ trải nghiệm với cộng đồng.

**Acceptance Criteria (AC):**
- [x] Form đăng bài: Cho phép upload nhiều ảnh, viết nội dung text.
- [x] Bài viết hiển thị trên Feed (Trang chủ) và Trang cá nhân của người dùng.
- [x] Gắn tag món ăn hoặc quán ăn vào bài viết.

---

## 2. Interaction & Notifications (Tương tác & Thông báo)

### US-18: Tương tác Bài viết (Like/Comment)
- **As a** người dùng
- **I want** thích (Like) và bình luận vào bài viết của người khác
- **So that** tăng tính tương tác xã hội.

**Acceptance Criteria (AC):**
- [x] Nút Like và hiển thị số lượng người thích.
- [x] Danh sách bình luận dưới mỗi bài viết.

### US-19: Thả tim món ăn (Food Card Likes)
- **As a** người dùng
- **I want** thả tim các món ăn cụ thể trên trang Explore/Home
- **So that** món ăn đó tăng độ phổ biến và AI hiểu gu của tôi hơn.

**Acceptance Criteria (AC):**
- [x] Hiển thị tổng lượt tim trên thẻ món ăn.
- [x] Lưu trạng thái người dùng đã thả tim vào Database.

### US-20: Hệ thống Thông báo (Notifications)
- **As a** người dùng
- **I want** nhận thông báo khi có người tương tác với bài viết của mình
- **So that** tôi có thể phản hồi kịp thời.

**Acceptance Criteria (AC):**
- [x] Thông báo Real-time khi được Like/Comment.
- [x] Tab thông báo hiển thị danh sách các hoạt động mới nhất.

### US-17+: Lưu bài viết (Saved Posts)
- **As a** thành viên cộng đồng
- **I want** lưu bài viết của người khác vào bộ sưu tập cá nhân
- **So that** tôi có thể tìm và đọc lại chúng một cách dễ dàng trong tương lai.

**Acceptance Criteria (AC):**
- [x] Nút "Lưu bài viết" trên từng Card bài đăng trong Feed.
- [x] Tab "Bài viết đã lưu" trong trang cá nhân hiển thị đầy đủ danh sách bài đăng đã lưu.

### US-17++: Chia sẻ nội bộ bài viết (Internal Post Share)
- **As a** thành viên cộng đồng
- **I want** chia sẻ bài viết của người khác lên trang cá nhân của mình
- **So that** bạn bè theo dõi tôi có thể nhìn thấy nội dung đó.

**Acceptance Criteria (AC):**
- [x] Nút "Chia sẻ" cho phép đăng lại bài viết gốc về tường nhà mình.
- [x] Bài đăng dạng share hiển thị liên kết trực tiếp và thông tin tác giả của bài viết gốc.

