# Engineering Tasks - Sprint 5

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 5.

## 1. Social Post System

### [Backend]
- [x] Task 1.1: Thiết kế Database Schema cho Post, PostImage và Tags.
- [x] Task 1.2: API đăng bài viết kèm xử lý upload ảnh (Cloudinary hoặc S3).
- [x] Task 1.3: API lấy danh sách bài viết (Feed) theo thời gian.
- [x] Task 1.3+: API POST /posts/:id/save và GET /posts/saved để lưu trữ bài viết.
- [x] Task 1.3++: API hỗ trợ chia sẻ bài viết chéo (isShared, sharedFromId).

### [Frontend]
- [x] Task 1.4: UI Form đăng bài viết (Post Editor).
- [x] Task 1.5: Component hiển thị bài viết (Post Card).
- [x] Task 1.6: Trang Feed hiển thị toàn bộ bài đăng cộng đồng.
- [x] Task 1.6+: UI Toggle lưu bài viết và tab hiển thị các bài viết đã lưu trong trang cá nhân.
- [x] Task 1.6++: UI Nút chia sẻ bài viết và hiển thị post chia sẻ trên Feed.

---

## 2. Interaction & Notifications

### [Backend]
- [x] Task 2.1: API Like/Unlike cho Bài viết và Món ăn.
- [x] Task 2.2: API CRUD bình luận (Comment system).
- [x] Task 2.3: Tích hợp WebSocket (Socket.io) để gửi thông báo Real-time.

### [Frontend]
- [x] Task 2.4: UI cho cụm tương tác Like/Comment trên PostCard.
- [x] Task 2.5: UI hiển thị danh sách người Like và Comment.
- [x] Task 2.6: Thành phần Notification Bell và danh sách thông báo.

