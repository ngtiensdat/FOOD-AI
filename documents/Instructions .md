# Agent Instructions: File Auditing & Documentation Workflow

Tài liệu này định nghĩa quy trình chuẩn (Standard Operating Procedure - SOP) để Agent (AI) phân tích, kiểm tra lỗi và tài liệu hoá (document) từng file mã nguồn trong dự án. Khi User yêu cầu kiểm tra một file kèm theo reference đến tài liệu này, Agent **BẮT BUỘC** phải thực hiện tuần tự các bước sau:

## Bước 1: Nạp Bối cảnh & Tiêu chuẩn (Context Activation)
- Truy xuất hoặc nhớ lại toàn bộ các nguyên tắc kiến trúc (Enterprise Architecture) được quy định trong thư mục `.agent/`: các rule, skill,...
- Nhớ lại các tiêu chí rà soát chất lượng code nghiêm ngặt trong thư mục `.check-prompt/` (Clean Code, Bắt lỗi Hardcode, Magic Values, Unused variables).

## Bước 2: Phân tích & Kiểm duyệt File (Code Audit)
Với mỗi file User cung cấp, Agent tiến hành:
1. **Phân tích mục đích:** Đọc mã nguồn, xác định rõ vai trò, chức năng cốt lõi và vị trí của file này trong tổng thể bức tranh hệ thống.
2. **Kiểm tra mã nguồn (Code Review):**
   - Rà soát các vi phạm về cấu trúc (Ví dụ: God Module, Component ôm đồm logic, thiếu Separation of Concerns).
   - Rà soát TypeScript: Tuyệt đối không lạm dụng kiểu `any`, không để sót cảnh báo (warning) đỏ trên IDE.
   - Tìm và đề xuất thay thế toàn bộ Hardcode/Magic strings thành hằng số (Constants).
3. **Khắc phục (Refactoring):** Thực hiện sửa chữa trực tiếp các lỗi kỹ thuật phát hiện được mà không làm hỏng logic nghiệp vụ hiện tại.

## Bước 3: Tài liệu hoá File (Header Documentation)
- Chấm điểm mã nguồn hiện tại và đưa ra các nhận xét cụ thể về những gì cần phải thay đổi, điều chỉnh cho phù hợp với các nguyên tắc ở trên.
- Sau khi mã nguồn đã đạt chuẩn, Agent **bắt buộc** chèn một khối bình luận (JSDoc/Comment) vào **dòng đầu tiên** của file với cấu trúc mẫu như sau:

```typescript
// Mục đích file này để làm gì
// Các file khác hay file này có ý nghĩa như nào
// Các chức năng đặc biệt 
// Các biến, hàm đặc biệt trong file
```

## Chú ý quan trọng dành cho Agent:
- Chỉ dọn dẹp mã nguồn (xoá unused imports, fix typing), **KHÔNG** tự ý thay đổi logic tính toán nghiệp vụ trừ khi logic đó gây crash hệ thống.
- Nếu file hiện tại đang check có liên quan đến các file khác (các file khác phải là các file chưa check trước đó) mà Agent có thể tiện check luôn thì có thể check luôn để tiết kiệm quota, token
- Báo cáo ngắn gọn cho User những gì cần sửa hoặc phát hiện sau khi hoàn tất bước 3 ở mỗi file, khi người dùng chấp thuận phương án sửa thì mới tiến hành sửa