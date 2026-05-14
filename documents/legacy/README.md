# Dự án FOOD AI - Tài liệu (Documentation)

Chào mừng bạn đến với hệ thống tài liệu của dự án **FOOD AI**. Cấu trúc này được thiết kế để quản lý dự án một cách chuyên nghiệp và dễ dàng mở rộng.

## 1. Hướng dẫn sử dụng
Các file tài liệu cũ (`.txt`, `.docx`) hiện vẫn nằm ở thư mục gốc của `/documents/`. Bạn nên:
1. Phân loại các file cũ vào đúng các thư mục chuyên biệt bên dưới.
2. Cập nhật nội dung cho các file `.md` mẫu đã được khởi tạo.
3. Sử dụng định dạng Markdown để AI có thể hỗ trợ đọc và phân tích tốt nhất.

## 2. Cấu trúc thư mục chi tiết

```text
documents/
├── ai/                      # Tài liệu về trí tuệ nhân tạo
│   ├── architecture.md      # Kiến trúc hệ thống AI (Tech stack, luồng xử lý)
│   ├── prompts.md           # Quản lý các mẫu câu lệnh (Prompt templates)
│   ├── rules.md             # Quy tắc hành xử và an toàn của AI
│   ├── skills.md            # Các kỹ năng cụ thể của AI Agent
│   └── workflows.md         # Luồng dữ liệu và logic xử lý AI
├── api/                     # Tài liệu kết nối hệ thống
│   └── endpoints.md         # Danh sách chi tiết các API Endpoints
├── backlog/                 # Quản lý tiến độ và công việc
│   ├── sprint-1/            # Giai đoạn 1 (Login, Core UI)
│   │   └── user-stories.md
│   ├── sprint-2/            # Giai đoạn 2 (AI Basic, Merchant)
│   │   └── user-stories.md
│   ├── sprint-3/            # Giai đoạn 3 (Social, AI Pro)
│   │   └── user-stories.md
│   ├── product-backlog.md   # Danh sách tổng thể User Stories
│   ├── roadmap.md           # Lộ trình phát triển tổng thể
│   └── todo.md              # Các đầu việc nhỏ đang thực hiện
├── database/                # Thiết kế cơ sở dữ liệu
│   └── erd.md               # Sơ đồ và cấu trúc các bảng (DBML)
├── requirements/            # Yêu cầu hệ thống
│   ├── business-rules.md    # Các quy định nghiệp vụ của ứng dụng
│   ├── srs.md               # Đặc tả yêu cầu phần mềm (Software Requirements)
│   ├── use-cases.md         # Các kịch bản sử dụng của người dùng
│   └── user-stories.md      # Các câu chuyện người dùng cụ thể
├── setup/                   # Hướng dẫn phát triển
│   ├── development-guide.md # Hướng dẫn cài đặt môi trường cho dev mới
│   ├── project-structure.md # Giải thích cấu trúc thư mục source code
│   └── technical-knowledge.md # Tổng hợp kiến thức kỹ thuật cần thiết
├── ui-ux/                   # Thiết kế giao diện
│   └── design-links.md      # Link Figma, Mockups và Style Guide
└── README.md                # File hướng dẫn tổng quan
```

---
*Hệ thống tài liệu được hỗ trợ khởi tạo bởi Antigravity.*
