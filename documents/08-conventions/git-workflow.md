# Git Workflow - FOOD AI

Dự án sử dụng mô hình **Git Flow** đơn giản hóa để quản lý phiên bản.

## 1. Các nhánh chính
- **`main`**: Chứa mã nguồn ổn định, đã qua kiểm thử và sẵn sàng triển khai (Production).
- **`develop`**: Nhánh chính của quá trình phát triển. Tất cả các tính năng mới đều được merge vào đây.

## 2. Các nhánh phụ
- **`feature/`**: Phát triển tính năng mới. Tách từ `develop`.
- **`bugfix/`**: Sửa các lỗi nhỏ. Tách từ `develop`.
- **`hotfix/`**: Sửa lỗi khẩn cấp trên môi trường Production. Tách từ `main`.

## 3. Quy trình làm việc
1. `git checkout develop`
2. `git pull origin develop`
3. `git checkout -b feature/tên-tính-năng`
4. Code và commit theo chuẩn.
5. Tạo **Pull Request (PR)** để merge vào `develop`.
6. Review code và merge.
