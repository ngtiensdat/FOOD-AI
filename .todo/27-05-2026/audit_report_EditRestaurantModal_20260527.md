# Báo Cáo Rà Soát Chất Lượng & Bảo Mật Mã Nguồn (AI Code Audit Report)
**Đối tượng Audit:** `EditRestaurantModal.tsx`
**Đường dẫn file:** [EditRestaurantModal.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/restaurant/EditRestaurantModal.tsx)
**Ngày thực hiện:** 27/05/2026
**Trạng thái audit:** RÀ SOÁT CHUYÊN SÂU & PHÁT HIỆN HÀNG LOẠT VI PHẠM NGUYÊN TẮC CỐT LÕI

---

## 1. PHÂN TÍCH TỔNG QUAN & BỀ MẶT TẤN CÔNG (Attack Surface Analysis)
- **Tác vụ:** Chỉnh sửa cấu hình toàn diện của Merchant (Tên, Bio, Mô tả, Ảnh đại diện, Ảnh bìa, Tỉnh/Thành phố, Quận/Huyện, Địa chỉ, SĐT, Giờ mở cửa, Đồng bộ avatar).
- **Điểm yếu kiến trúc:** Component này đóng vai trò là "Super Component" khi vừa gánh vác phần hiển thị giao diện cài đặt phức tạp, vừa render Live Preview của thẻ nhà hàng thời gian thực, đồng thời tự quản lý toàn bộ trạng thái dữ liệu (17 states) và xử lý validation nghiệp vụ. Điều này vi phạm trực tiếp các nguyên tắc thiết kế sạch (Clean Architecture) của dự án.

---

## 2. DANH SÁCH CÁC LỖI & VI PHẠM NGUYÊN TẮC (Chi Tiết Phân Loại)

### 2.1. [Nghiêm Trọng] Vi Phạm Nguyên Tắc Bất Đối Xứng Logic & Phân Tách Trách Nhiệm (State Separation & Separation of Concerns)
- **Vị trí:** Toàn bộ component (Dòng 28 đến 46)
- **Nguyên tắc vi phạm:** [frontend-architecture-rule.md](file:///e:/FOOD_AI_code/.agent/rule/frontend-architecture-rule.md) - Section 4: *"Khi một Component có quá 5-7 cái `useState`, đó là tín hiệu phải tách chúng ra một Custom Hook hoặc chia nhỏ Component."*
- **Chi tiết vi phạm:**
  Component khai báo tới **17 `useState`**:
  ```typescript
  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'contact'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Hà Nội');
  const [district, setDistrict] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bio, setBio] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [syncWithPersonalAvatar, setSyncWithPersonalAvatar] = useState(false);
  const [syncWithPersonalCover, setSyncWithPersonalCover] = useState(false);
  ```
- **Hệ quả:** Mã nguồn dài, phức tạp, trộn lẫn logic điều khiển giao diện (View) với logic quản lý dữ liệu (Model/State), gây khó khăn cực lớn cho việc viết Unit Test và bảo trì.
- **Giải pháp xử lý:** Tách toàn bộ 17 states này cùng các hàm xử lý dữ liệu (`handleSubmit`, `handleCityChange`, `load initial data`) ra một Custom Hook riêng biệt có tên là `useEditRestaurant.ts`.

---

### 2.2. [Nghiêm Trọng] Vi Phạm Nguyên Lý Đơn Trách Nhiệm (Single Responsibility Principle)
- **Vị trí:** Dòng 80 đến 121 (`handleSubmit`), Dòng 68 đến 78 (`handleCityChange`)
- **Nguyên tắc vi phạm:** [frontend-architecture-rule.md](file:///e:/FOOD_AI_code/.agent/rule/frontend-architecture-rule.md) - Section 1: *"Component (View) chỉ chịu trách nhiệm hiển thị (UI) và nhận tương tác. Tuyệt đối không chứa logic xử lý dữ liệu, tính toán phức tạp."*
- **Chi tiết vi phạm:** Component tự thực hiện biểu thức chính quy (Regex) để validate định dạng giờ giấc `openingHours`:
  ```typescript
  if (openingHours && !/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(openingHours)) { ... }
  ```
  Và tự điều phối việc chuyển đổi tỉnh thành phố, tự động chọn quận huyện mặc định tương ứng từ mảng tĩnh `LOCATION_DATA`.
- **Hệ quả:** Logic nghiệp vụ bị phân tán tại View. Nếu có component khác cũng muốn cập nhật thông tin tương tự thì sẽ phải sao chép lại đoạn logic này.
- **Giải pháp xử lý:** Đưa toàn bộ logic validation và đổi tỉnh thành vào Custom Hook để View chỉ cần gọi hàm handler sạch sẽ.

---

### 2.3. [Cao] Mất An Toàn Kiểu Dữ Liệu Tĩnh (TypeScript Any Anti-Pattern)
- **Vị trí:** Dòng 18-19, dòng 116
- **Nguyên tắc vi phạm:** Tiêu chuẩn Type Safety & Kiến trúc TypeScript của dự án.
- **Chi tiết vi phạm:**
  Sử dụng kiểu `any` vô điều kiện:
  ```typescript
  restaurant: any;
  onSave: (data: any) => Promise<any>;
  catch (err: any)
  ```
- **Hệ quả:** Vô hiệu hóa trình biên dịch TypeScript. Nếu thuộc tính bên trong `restaurant` bị thay đổi từ phía API/Backend, IDE sẽ không thể cảnh báo lỗi thời gian biên dịch (compile-time error), dẫn đến các lỗi runtime crash dạng `Cannot read properties of undefined`.
- **Giải pháp xử lý:** Khai báo kiểu dữ liệu tường minh:
  ```typescript
  interface Restaurant {
    id: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    district?: string;
    mapUrl?: string;
    profile?: {
      logo?: string;
      coverImage?: string;
      bio?: string;
      contactEmail?: string;
      contactPhone?: string;
      openingHours?: string;
    };
  }
  ```

---

### 2.4. [Cao] Vi Phạm Hệ Thống Design Tokens & Dùng Magic Values
- **Vị trí:** Dòng 124, 125, 171, 180, 192, 195
- **Nguyên tắc vi phạm:** [frontend-ui-rule.md](file:///e:/FOOD_AI_code/.agent/rule/frontend-ui-rule.md) - Section 2: *"CẤM dùng `rounded-[...]`, `bg-[#...]`, `text-[...]`. Tất cả phải khai báo trong `tailwind.config.ts`."*
- **Chi tiết vi phạm:**
  Sử dụng các class tùy biến không chuẩn hóa:
  - `rounded-[32px]` (Dòng 125)
  - `text-[10px]` (Dòng 171, 192, 195)
  - `text-[11px]` (Dòng 180)
  - `h-[90vh] max-h-[750px]` (Dòng 125)
- **Hệ quả:** Phá vỡ tính đồng bộ nhất quán về UI/UX trên toàn bộ hệ thống. Gây khó khăn khi thay đổi giao diện hoặc đổi theme (Light/Dark mode) vì các giá trị tuyệt đối này không thể quản lý tập trung qua cấu hình Tailwind.
- **Giải pháp xử lý:** Thay thế bằng token chuẩn: `rounded-3xl`, `text-xs`, `text-small`, và sử dụng các class layout đồng bộ của dự án.

---

### 2.5. [Trung Bình] Hardcode Dữ Liệu & Nhãn Trực Quan trong Live Preview
- **Vị trí:** Dòng 171 (Verified label), Dòng 192-198 (Danh sách tags)
- **Nguyên tắc vi phạm:** [frontend-architecture-rule.md](file:///e:/FOOD_AI_code/.agent/rule/frontend-architecture-rule.md) - Section 5: *"Zero Hardcoding - Các mảng dữ liệu tĩnh phải nằm trong constants; các thông tin hiển thị phải phản ánh đúng dữ liệu."*
- **Chi tiết vi phạm:**
  - Nhãn `Verified` được render tĩnh mặc dù không có thuộc tính xác thực nào từ `restaurant` được truyền vào.
  - Hai tag `Bún/Phở` và `Món Nước` bị gõ cứng 100%, không đồng bộ với các danh mục ẩm thực thực tế của nhà hàng.
- **Giải pháp xử lý:** Chuyển các tag thành dạng động, lấy dữ liệu từ `restaurant.categories` hoặc `restaurant.tags` (nếu có).

---

### 2.6. [Trung Bình] Vi Phạm Khả Năng Tiếp Cận (Accessibility & SEO)
- **Vị trí:** Dòng 218 đến 223
- **Nguyên tắc vi phạm:** [frontend-ui-rule.md](file:///e:/FOOD_AI_code/.agent/rule/frontend-ui-rule.md) - Section 4: *"Mọi nút bấm icon-only phải có `aria-label` cho trình đọc màn hình."*
- **Chi tiết vi phạm:**
  Nút đóng modal chỉ chứa thẻ `<X size={20} />` mà hoàn toàn thiếu thuộc tính `aria-label`.
- **Giải pháp xử lý:** Thêm thuộc tính `aria-label="Đóng cài đặt cửa hàng"` vào thẻ `<button>`.

---

### 2.7. [Thấp] Lỗi Trùng Lặp Code Tĩnh & Chưa Tối Ưu State
- **Vị trí:** Dòng 12, Dòng 36, Dòng 61
- **Chi tiết vi phạm:**
  - Dòng 61: Gán dữ liệu lặp lại vô nghĩa: `restaurant.profile?.contactPhone || restaurant.profile?.contactPhone || ''`
  - Dòng 12: Import dư thừa `LABELS` không sử dụng.
  - Dòng 36: State `city` khởi tạo mặc định bằng chuỗi cứng `'Hà Nội'` thay vì đồng bộ qua giá trị cấu hình `LOCATION_DATA[0].value`.
- **Giải pháp xử lý:** Xóa import thừa, tối ưu biểu thức gán và đồng bộ hóa giá trị mặc định.

---

## 3. ĐÁNH GIÁ ĐIỂM SỐ CHẤT LƯỢNG CODEBASE (Scoring)

Dựa trên các quy tắc nghiêm ngặt của dự án, thang điểm chi tiết cho `EditRestaurantModal.tsx` được điều chỉnh như sau:

| Tiêu chí | Điểm cũ | Điểm mới | Nhận xét chi tiết |
| :--- | :---: | :---: | :--- |
| **Tính Bảo Mật (Security)** | 9/10 | **8/10** | Dùng SafeImage tốt nhưng kiểu `any` lỏng lẻo ở dữ liệu nhạy cảm (SĐT, Email) có thể tăng rủi ro lỗi runtime. |
| **Kiến Trúc Sạch (Architecture)** | 8/10 | **4/10** | **Vi phạm nghiêm trọng** nguyên tắc phân tách View - Logic. Ôm đồm 17 states, tự xử lý validation và địa điểm. |
| **Bảo Trì & Mở Rộng (Maintainability)** | 7/10 | **5/10** | File quá dài, khó bảo trì, lạm dụng `any` làm mất tính an toàn của TypeScript. |
| **Độ Hoàn Thiện (Production Readiness)** | 8/10 | **6/10** | Giao diện preview tốt nhưng vi phạm Accessibility (Aria) và ngập tràn Magic Values, Hardcoded UI. |
| **ĐIỂM TRUNG BÌNH** | **8.0** | **5.75 / 10** | **Cần tái cấu trúc ngay lập tức** trước khi bàn giao (Production). |

---

## 4. KẾ HOẠCH NÂNG CẤP CHI TIẾT (Action Items & Implementation Plan)

### Bước 1: Thiết lập các Interfaces chuẩn
Xác định cấu trúc dữ liệu chặt chẽ cho `EditRestaurantModalProps` và `UpdateRestaurantInput`.

### Bước 2: Xây dựng Custom Hook `useEditRestaurant.ts`
Tách toàn bộ 17 `useState`, hàm `handleCityChange`, logic validate Regex, và hàm submit `handleSubmit` ra khỏi file component.

### Bước 3: Chuẩn hóa UI theo Design System Token & Accessibility
- Thay thế các class magic `rounded-[32px]`, `text-[10px]`... bằng các token chuẩn của Tailwind.
- Bổ sung `aria-label` cho nút Close.
- Thay thế phần tags ẩm thực hardcode bằng map danh mục thực tế của cửa hàng.

---
*Báo cáo được ký duyệt bởi AI Auditor Agent.*
