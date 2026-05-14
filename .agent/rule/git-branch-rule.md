# Rule: Git Branching & Commit Standard (Perfect Version)

## 1. Branch Naming
- `feature/`, `bugfix/`, `hotfix/`, `refactor/`.
- Tên nhánh phải ngắn gọn, súc tích (ví dụ: `feature/auth-google`).

## 2. Conventional Commits (Strict)
Mọi commit PHẢI bắt đầu bằng: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`.
- Ví dụ: `feat(api): add food recommendation endpoint`

## 3. Pull Request & Squash (Gom Commit)
- **PR Requirement:** Mỗi tính năng lớn phải có một PR riêng.
- **Squash Merge:** Khi merge vào `main`, khuyến khích sử dụng **Squash Merge** để biến hàng chục commit nhỏ thành 1 commit duy nhất mang tính cột mốc. Điều này giúp lịch sử `main` cực kỳ sạch.

## 4. Automation & Safety
- AI không được phép force push (`--force`).
- Phải liệt kê danh sách file thay đổi cho User duyệt trước khi Push.

## Checklist
- [ ] Commit message đã có prefix chuẩn chưa?
- [ ] Nhánh feature đã được xóa sau khi merge chưa?
- [ ] PR đã mô tả rõ những gì đã thay đổi chưa?
