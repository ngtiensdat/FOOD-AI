# Git Workflow - FOOD AI

Dự án sử dụng mô hình **Git Flow** đơn giản hóa để quản lý phiên bản, đặc biệt tập trung vào quá trình refactor hệ thống.

## 1. Ba loại Branch cần nắm vững

| Branch | Mục đích | Ví dụ tên |
| :--- | :--- | :--- |
| **`main`** | Code production, **chỉ merge từ `develop`** sau khi pass Sprint Review. | `main` |
| **`develop`** | Code đã pass review, tích lũy giữa các Sprint. | `develop` |
| **`feature/<tên>`** | Code đang viết cho 1 tính năng hoặc 1 công việc cụ thể. | `feature/refactor-user-module` |

---

## 2. BƯỚC 0 — Cứu code hiện tại TRƯỚC KHI làm gì khác

Trước khi chạm vào setup Git mới, hãy thực hiện các lệnh sau để tạo "lưới an toàn":

```bash
# 1. Tạo backup branch từ main hiện tại
git checkout main
git pull origin main
git checkout -b backup/before-refactor-2026-05-15

# 2. Push backup lên remote — đây là "bảo hiểm"
git push origin backup/before-refactor-2026-05-15

# 3. Quay lại main
git checkout main
```

> [!IMPORTANT]
> Bây giờ dù làm sai gì cũng có thể `git checkout backup/before-refactor-2026-05-15` để lấy lại bản cũ. **Đừng bao giờ xóa branch backup này** cho đến khi refactor xong và chạy ổn định khoảng 2 tuần.

---

## 3. Setup branch chuẩn (chạy 1 lần duy nhất)

Sau khi đã có backup an toàn, hãy thực hiện các bước sau để chuẩn hóa cấu trúc:

```bash
# Đứng trên main, tạo develop từ main
git checkout main
git checkout -b develop
git push -u origin develop

# Tạo feature branch riêng cho việc refactor
git checkout develop
git checkout -b feature/refactor-code-structure
git push -u origin feature/refactor-code-structure
```

> [!CAUTION]
> Từ giờ bạn hãy code **TẤT CẢ** trên nhánh `feature/refactor-code-structure`. **Tuyệt đối không** động trực tiếp vào `main` hay `develop` nữa cho đến khi hoàn tất đợt refactor này.

---

## 4. Flow hằng ngày (4 bước, làm lặp lại)

### Bước 1 — Sáng vào, đồng bộ code mới nhất
Trước khi bắt đầu code, hãy đảm bảo bạn có code mới nhất từ team:
```bash
git checkout develop
git pull origin develop
git checkout feature/refactor-code-structure
git merge develop
```
> [!TIP]
> Nếu có **conflict** ở bước `merge`, hãy mở từng file có dấu `<<<<<<<`, chọn version đúng, xóa marker, rồi `git add .` + `git commit`.

### Bước 2 — Code
Làm việc bình thường trong VS Code. **Lưu ý:** Đừng làm một lèo 8 tiếng rồi mới commit — **mỗi việc nhỏ xong là commit 1 lần.**

### Bước 3 — Commit (theo chuẩn Convention)
```bash
git add .
git commit -m "refactor: tách user logic ra service layer"
```

**Bảng quy tắc viết Commit Message (Conventional Commits):**

| Prefix | Khi nào dùng | Ví dụ |
| :--- | :--- | :--- |
| **`feat:`** | Thêm tính năng mới | `feat: thêm API đăng nhập Google` |
| **`fix:`** | Sửa bug | `fix: chữa lỗi 500 khi user không có avatar` |
| **`refactor:`** | Đổi cấu trúc code, không đổi behavior | `refactor: tách user logic ra service layer` |
| **`docs:`** | Sửa README, comment | `docs: thêm hướng dẫn setup .env` |
| **`chore:`** | Cài package, đổi config | `chore: install mongoose 8.0` |
| **`style:`** | Format code, lint | `style: format toàn bộ src/ theo prettier` |
| **`test:`** | Thêm/sửa test | `test: thêm unit test cho user service` |

> [!NOTE]
> Bạn có thể viết bằng **Tiếng Việt**. Tránh viết chung chung như "update", "fix bug" — phải nói rõ sửa gì.

### Bước 4 — Push lên remote (1-2 lần/ngày)
```bash
git push origin feature/refactor-code-structure
```
> [!IMPORTANT]
> **Push thường xuyên** giúp code luôn có bản backup trên GitHub, lỡ máy hỏng cũng không lo mất code.

---

## 5. Khi hoàn thành 1 phần — Tạo Pull Request (PR)

Khi bạn hoàn tất 1 module (ví dụ: refactor xong user module + chạy thử OK):

1. **Push lần cuối** lên feature branch.
2. Vào **GitHub** -> Repo của bạn -> tab **"Pull requests"** -> **"New pull request"**.
3. Chọn: **base:** `develop` ← **compare:** `feature/refactor-code-structure`.
4. Viết **PR description** ngắn gọn theo mẫu:

```markdown
## Mục đích
Refactor user module theo cấu trúc Clean Architecture mới.

## Thay đổi
- Tách user logic từ controller xuống service layer
- Move database query xuống repository
- Đổi tên file theo convention mới

## Test thế nào
- Đã chạy thử API GET /users -> trả về danh sách OK
- Đã chạy thử POST /users -> tạo user mới OK
- Chưa có unit test (Sprint sau làm)

## Note cho reviewer
Có 1 chỗ TODO trong file `user.service.ts` chưa xử lý error case khi email trùng.
```

5. **Tag mentor (Kevin)** làm reviewer -> chờ feedback -> fix -> merge vào `develop`.

> [!CAUTION]
> **KHÔNG được tự ý self-merge PR** nếu chưa có người review.

---

## 6. Quy tắc vàng cho REFACTOR

Vì bạn đang refactor (khác với code tính năng mới), rủi ro phá vỡ code đang chạy rất cao. Hãy áp dụng 5 quy tắc vàng:

1. **Refactor 1 module 1 lần:** Không đụng nhiều thứ cùng lúc. Làm xong 1 module → commit → test → mới làm tiếp module sau.
2. **Test trước khi commit:** Mỗi lần refactor xong phải chạy thử API (Postman/browser). Nếu test bị broken → BIẾT ngay chỗ nào sai để rollback.
3. **Prefix luôn là `refactor:`:** Luôn dùng prefix này cho commit message để sau này dễ tìm lại.
4. **KHÔNG vừa refactor vừa thêm tính năng:** Đừng trộn 2 việc này lại, bạn sẽ không thể debug nổi khi có bug phát sinh.
5. **PR nhỏ và thường xuyên:** Sau mỗi 5-10 commit, hãy tạo PR nhỏ merge vào `develop`. Đừng để feature branch dài 200 commit mới merge, sẽ bị conflict rất khủng khiếp.

---

## 7. Checklist mỗi ngày trước khi tắt máy

Trước khi kết thúc ngày làm việc, hãy dành 1 phút để check:
- [ ] Đã `git push` code lên feature branch chưa? (Tránh để code chỉ nằm ở máy cục bộ).
- [ ] Commit message cuối có rõ ràng không? (Để mai mở lên vẫn hiểu mình đang làm gì).
- [ ] Có file nào còn dấu conflict `<<<<<<<` chưa xử lý không? (Dùng `git status` để check).
- [ ] Branch hiện tại có đúng là feature branch (`feature/refactor-code-structure`) không? (Dùng `git branch` để kiểm tra).

---

## 8. Cách hỏi Mentor khi gặp vấn đề

Đừng hỏi chung chung "Git bị lỗi rồi", hãy hỏi cụ thể để nhận được câu trả lời nhanh nhất:

*   ❌ **Sai:** "Anh ơi Git em bị lỗi."
*   ✅ **Đúng:** "Anh ơi, em chạy `git pull origin develop` thì báo conflict ở file `user.service.ts`. Em mở ra thấy có dấu `<<<<<<<` ở dòng 45, em không chắc nên giữ phần nào. Anh xem giúp em với?"

**Khi hỏi, hãy luôn cung cấp:**
1. Lệnh bạn vừa chạy.
2. Thông báo lỗi đầy đủ (copy text hoặc screenshot).
3. Đoạn code đang gặp vấn đề.

---

## TL;DR — 5 Quy tắc "Sống Còn"

1. **Backup branch** trước khi refactor: `backup/before-refactor-<ngày>`.
2. **Không bao giờ commit thẳng vào `main`**: Luôn làm trên `feature/<tên>`.
3. **Commit message phải có prefix**: `refactor:`, `feat:`, `fix:`, ...
4. **Push lên remote 1-2 lần/ngày**: Để luôn có bản backup trên GitHub.
5. **PR merge vào `develop`**: Không merge thẳng vào `main`, phải chờ Kevin review.
