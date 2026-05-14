# Dự án FOOD AI - Tài liệu (Documentation)

Chào mừng bạn đến với hệ thống tài liệu của dự án **FOOD AI**. Các thư mục được đánh số theo luồng tư duy để bạn dễ dàng nắm bắt dự án từ tổng quan đến chi tiết.

## 1. Hướng dẫn sử dụng
Bạn nên đọc tài liệu theo thứ tự từ **01** đến **08** để hiểu rõ nhất về hệ thống. Các file cũ (`.txt`, `.docx`) đã được chuyển vào thư mục `legacy`.

## 2. Cấu trúc thư mục chi tiết (Reading Order)

```text
documents/
├── 01-requirements/         # [BẮT ĐẦU TẠI ĐÂY] Hiểu về yêu cầu và nghiệp vụ
│   ├── use-cases/           # Thư mục các kịch bản sử dụng (Detail)
│   │   ├── admin.md
│   │   ├── customer.md
│   │   └── merchant.md
│   ├── user-stories/        # Thư mục các câu chuyện người dùng (Master)
│   │   ├── admin.md
│   │   ├── customer.md
│   │   └── merchant.md
│   ├── business-rules.md
│   └── srs.md
├── 02-system-architecture/   # Kiến trúc hệ thống toàn diện
│   ├── overall-architecture.md
│   ├── frontend-architecture.md
│   ├── backend-architecture.md
│   ├── ai-architecture.md
│   ├── microservices.md
│   └── deployment-architecture.md
├── 03-database/             # Cấu trúc dữ liệu và quan hệ (ERD)
│   ├── database-description.md # Mô tả chi tiết ý nghĩa các bảng
│   └── erd-v1.md            # Sơ đồ ERD (Phiên bản 1)
├── 04-api/                  # Tài liệu các cổng kết nối (Endpoints)
│   └── endpoints.md
├── 05-ui-ux/                # Giao diện và trải nghiệm người dùng
│   └── design-links.md
├── 06-backlog/              # Quản lý tiến độ (Sprints & Roadmap)
│   ├── sprint-1/
│   ├── sprint-2/
│   ├── sprint-3/
│   ├── product-backlog.md
│   └── roadmap.md
├── 07-setup/                # Hướng dẫn kỹ thuật và cài đặt
│   ├── development-guide.md
│   ├── project-structure.md
│   └── technical-knowledge.md
├── 08-conventions/          # Quy tắc và chuẩn mực phát triển
│   ├── coding-convention.md
│   ├── git-workflow.md
│   ├── branch-naming.md
│   ├── commit-convention.md
│   └── folder-structure.md
├── legacy/                  # Các file tài liệu cũ (để tham khảo)
└── README.md                # File hướng dẫn này
```

---
*Hệ thống tài liệu được hỗ trợ khởi tạo bởi Antigravity.*
