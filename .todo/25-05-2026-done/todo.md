# DANH SÁCH CÔNG VIỆC CẦN LÀM (TO-DO LIST) - 25/05/2026

## 1. Quy Trình Git & Nhánh (Git Workflow & Best Practices)
- [x] **Commit & Merge Nhánh hiện tại:**
  - [x] Stage và Commit toàn bộ tài liệu đã hoàn thành trên nhánh hiện tại (`feature/additional-doc`).
    ```bash
    git add .
    git commit -m "docs: cập nhật tài liệu kiến trúc, RBAC, debug guide và codebase score history"
    ```
- [x] **Gộp nhánh `feature/feat-img-default`:**
  - [x] Chuyển sang nhánh `develop`: `git checkout develop`
  - [x] Kéo code mới nhất: `git pull origin develop`
  - [x] Gộp nhánh ảnh: `git merge feature/feat-img-default`
  - [x] Đẩy lên remote: `git push origin develop`
- [x] **Gộp nhánh `feature/additional-doc`:**
  - [x] Chuyển lại nhánh tài liệu: `git checkout feature/additional-doc`
  - [x] **Thực hiện Rebase thay vì Merge:** Thay vì gộp merge commit, thực hiện rebase để lịch sử git phẳng và diff sạch hơn:
    ```bash
    git rebase develop
    ```
  - [x] Chuyển sang `develop` và gộp: `git checkout develop` rồi `git merge feature/additional-doc`
  - [x] Đẩy lên remote: `git push origin develop`
- [x] **Atomic Commits & Tách nhỏ PR:**
  - [x] Chia nhỏ các PR trong tương lai: Tách biệt các tính năng độc lập (ví dụ: Modal riêng, setup ảnh riêng) thay vì nén chung 4-5 tính năng vào 1 PR lớn.
  - [x] Đảm bảo commit mang tính atomic: Không gộp cả sửa lỗi (fix) và tính năng mới (feat) vào chung một commit (tránh viết commit dạng "feat: sửa lỗi A và thêm B").

## 2. Refactor Code Quality (Phản hồi của Mentor)

### :red_circle: Cần sửa (Ưu tiên cao - High)
- [x] **Thiếu file ảnh mặc định placeholder:**
  - [x] Kiểm tra xem file `/placeholder-food.jpg` hoặc ảnh tương đương đã có trong thư mục `my-web/frontend/public/` hay chưa.
  - [x] Bổ sung file ảnh placeholder thực tế vào `my-web/frontend/public/placeholder-food.jpg` (hoặc cấu hình hàm trỏ về file `.svg` mặc định sẵn có trong dự án) để tránh lỗi 404 khi load ảnh lỗi.
- [x] **Guard kiểm tra Hostname cho hình ảnh:**
  - [x] Hàm `getValidImageUrl` hiện tại mới chỉ kiểm tra định dạng URL (http, https, /...), chưa kiểm tra tên miền (hostname). Nếu DB có chứa ảnh từ domain lạ ngoài 4 host được cấu hình trong `next.config.ts` (`res.cloudinary.com`, `images.unsplash.com`, `lh3.googleusercontent.com`, `cafefcdn.com`), `next/image` sẽ bị crash runtime.
  - [x] Refactor hàm `getValidImageUrl` để kiểm tra hostname:
    - Nếu là 4 host trong whitelist -> tiếp tục render bằng component `SafeImage` sử dụng `next/image`.
    - Nếu là host lạ ngoài whitelist -> render dự phòng (fallback) bằng thẻ `<img>` thường của HTML hoặc thêm thuộc tính `unoptimized` để Next.js bỏ qua tối ưu hóa ảnh và tránh crash ứng dụng.

### :large_yellow_circle: Nên cải thiện (Ưu tiên trung bình - Medium)
- [x] **DRY Code (Trùng lặp logic giờ mở cửa):**
  - [x] Gom logic `isRestaurantCurrentlyOpen` dùng chung vào [helpers.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/utils/helpers.ts) và loại bỏ phiên bản local trùng lặp trong [ProfileHeader.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/ProfileHeader.tsx).
  - [x] Trích xuất regex validate giờ mở cửa thành hàm `isValidOpeningHours` trong [helpers.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/utils/helpers.ts) và dùng lại trong cả [useRestaurantActions.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/hooks/useRestaurantActions.ts) lẫn [useOnboardingActions.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/hooks/useOnboardingActions.ts).
- [x] **Loại bỏ `document.getElementById`:**
  - [x] Thay thế cách lấy giá trị trực tiếp từ DOM bằng Controlled State React (`openingHoursText` và `onChange`) trong trang [restaurant-admin/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/restaurant-admin/page.tsx).

### :large_green_circle: Nhỏ (Ưu tiên thấp - Low)
- [x] **Khôi phục exit animation của `ConfirmModal`:**
  - [x] Di chuyển điều kiện `isOpen && (...)` vào bên trong [ConfirmModal.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/base/ConfirmModal.tsx) và render component unconditional ở phía parent. Khi đóng modal, `<AnimatePresence>` chạy mượt mà hiệu ứng thoát.
  - [x] Sửa lại các chỗ dùng modal ở [CategoryManager.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/CategoryManager.tsx) và [restaurant-admin/page.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/app/restaurant-admin/page.tsx) để mount sẵn và truyền prop `isOpen`.
- [x] **Sửa class trùng lặp:**
  - [x] Xóa bỏ class `h-12` bị viết lặp hai lần trong div chứa icon của [ConfirmModal.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/base/ConfirmModal.tsx).
- [x] **Loại bỏ `as any` tại variant button:**
  - [x] Thêm định nghĩa kiểu trả về tường minh (`: 'red' | 'primary'`) cho hàm `getConfirmButtonVariant()` trong [ConfirmModal.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/base/ConfirmModal.tsx).
- [x] **Tối ưu hàm check thay đổi tại `updateFood`:**
  - [x] Viết lại logic check change trong [food.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/food/food.service.ts) theo dạng generic sử dụng `Object.keys(dto)`. Tự động so sánh động, xử lý được cả mảng, số, và tránh bị sót khi thêm field mới.

## 3. Bổ sung Unit Tests
- [x] Viết unit tests cho các hàm thuần tiện ích ở frontend trong [helpers.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/utils/helpers.ts):
  - [x] Lập test suite kiểm thử `getValidImageUrl` (URL hợp lệ, URL trống, fallback ảnh mặc định, hostname trong/ngoài whitelist).
  - [x] Lập test suite kiểm thử `isValidOpeningHours` (Đúng định dạng, định dạng sai, giờ phút vượt ngưỡng).
  - [x] Lập test suite kiểm thử `isRestaurantCurrentlyOpen` (Trong giờ mở cửa, ngoài giờ mở cửa, trường hợp qua đêm).

## 4. Setup Tooling cho Dự án (Git hooks & Linters)
- [x] **lint-staged:**
  - [x] Thêm `lint-staged` vào `devDependencies` ở file [package.json](file:///e:/FOOD_AI_code/package.json) gốc để tránh việc tải xuống mỗi lần commit:
    ```bash
    npm i -D lint-staged
    ```
  - [x] Sửa cấu hình `lint-staged` trong `package.json` gốc để chỉ linter trên các file đang staged thay vì quét toàn bộ thư mục `src`:
    ```json
    "lint-staged": {
      "my-web/backend/src/**/*.ts": "eslint --fix",
      "my-web/frontend/src/**/*.{ts,tsx}": "eslint"
    }
    ```
- [x] **Enforce Conventional Commit (Bắt buộc định dạng commit):**
  - [x] Cài đặt công cụ chặn và kiểm tra định dạng commit:
    ```bash
    npm install --save-dev @commitlint/cli @commitlint/config-conventional
    ```
  - [x] Tạo file cấu hình `commitlint.config.js` ở root.
  - [x] Thêm hook `commit-msg` vào Husky để tự động kiểm tra định dạng commit trước khi ghi nhận.
- [x] **Dọn dẹp tệp tin rác:**
  - [x] Xóa bỏ các file log lỗi `eslint_errors.txt`, `eslint_errors_utf8.txt` khỏi dự án.
  - [x] Thêm các file log lỗi này vào [.gitignore](file:///e:/FOOD_AI_code/.gitignore).
