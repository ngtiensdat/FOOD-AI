# Mô tả Cơ sở dữ liệu (Database Description) - FOOD AI

Tài liệu này giải thích chi tiết ý nghĩa và vai trò của các bảng trong hệ thống.

## 1. Phân hệ Người dùng & Hồ sơ (Users & Profiles)
- **`users`**: Bảng gốc lưu trữ thông tin tài khoản, mật khẩu, vai trò (Customer, Restaurant, Admin) và trạng thái (Pending, Approved).
- **`user_profiles`**: Thông tin cá nhân chi tiết của người dùng. Đặc biệt chứa trường `embedding` để AI hiểu sở thích của người dùng.

## 2. Phân hệ Nhà hàng & Món ăn (Restaurants & Foods)
- **`restaurants`**: Thông tin về các địa điểm ăn uống, bao gồm tọa độ địa lý để tìm kiếm quanh đây.
- **`restaurant_profiles`**: Thông tin bổ sung như giờ mở cửa, ảnh bìa, bio của nhà hàng.
- **`foods`**: Danh sách món ăn. Chứa trường `embedding` để thực hiện tìm kiếm ngữ nghĩa (Semantic Search).
- **`categories` & `food_categories`**: Phân loại món ăn giúp người dùng lọc nhanh.

## 3. Phân hệ Nội dung & Tương tác (Social & Interaction)
- **`posts`**: Bài đăng review, khuyến mãi hoặc thông báo từ nhà hàng/người dùng.
- **`likes`, `comments`, `follows`**: Các tính năng mạng xã hội để tăng tương tác.
- **`favorites`**: Lưu trữ các món ăn mà người dùng yêu thích.
- **`histories`**: Nhật ký các món ăn/nhà hàng người dùng đã xem.

## 4. Phân hệ AI Chat (Conversational AI)
- **`conversations`**: Quản lý các phiên hội thoại giữa người dùng và AI.
- **`messages`**: Chi tiết nội dung chat, vai trò (User/AI) và thời gian.

## 5. Phân hệ Hệ thống (System)
- **`reports`**: Xử lý các báo cáo vi phạm từ người dùng.
- **`embeddings_log`**: Nhật ký quá trình tạo và cập nhật vector embedding.

---
*Tài liệu này bổ trợ cho sơ đồ thực thể [erd-v1.md](./erd-v1.md).*
