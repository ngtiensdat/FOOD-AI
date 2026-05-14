# Kiến trúc AI - FOOD AI

Tài liệu này tập trung vào cách tích hợp Trí tuệ nhân tạo vào dự án.

## 1. Giải pháp công nghệ
- **OpenAI API:** Sử dụng mô hình `gpt-4` cho hội thoại và `text-embedding-3-small` cho vector hóa.
- **Vector Search:** Sử dụng extension `pgvector` trên PostgreSQL để tìm kiếm độ tương đồng.

## 2. Cơ chế RAG (Retrieval-Augmented Generation)
1. **Thu thập (Retrieve):** Khi người dùng đặt câu hỏi, hệ thống tạo vector embedding cho câu hỏi đó.
2. **Tìm kiếm:** Truy vấn database để tìm các món ăn có vector gần nhất với yêu cầu.
3. **Tăng cường (Augment):** Đưa danh sách món ăn tìm được vào Prompt gửi cho OpenAI.
4. **Tạo phản hồi (Generate):** AI trả về câu trả lời tự nhiên kèm theo gợi ý món ăn có thực trong hệ thống.

## 3. Quản lý AI Agent
- **Skills:** Các khả năng cụ thể như gợi ý món ăn, tính calo.
- **Rules:** Giới hạn AI chỉ trả lời về ẩm thực và các dữ liệu hợp lệ.
