# Commit Convention - FOOD AI

Dự án tuân thủ chuẩn **Conventional Commits** để tự động hóa việc tạo changelog và quản lý lịch sử.

## 1. Cấu trúc Message
`<type>(<scope>): <description>`

## 2. Các loại Commit (Types)
- **`feat`**: Một tính năng mới cho người dùng.
- **`fix`**: Sửa một lỗi (bug).
- **`docs`**: Chỉ thay đổi tài liệu.
- **`style`**: Thay đổi định dạng (whitespace, formatting) không ảnh hưởng đến logic.
- **`refactor`**: Thay đổi code nhưng không sửa lỗi cũng không thêm tính năng.
- **`perf`**: Thay đổi code để cải thiện hiệu năng.
- **`test`**: Thêm hoặc sửa các đoạn code test.
- **`chore`**: Các thay đổi nhỏ trong quá trình build hoặc công cụ bổ trợ.

## 3. Ví dụ
- `feat(auth): add login with ai capability`
- `fix(ui): resolve overlap issue on mobile menu`
- `docs(readme): update system architecture diagram`
