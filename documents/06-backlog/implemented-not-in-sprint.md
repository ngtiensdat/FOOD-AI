# Implemented Features Not Clearly Captured In Sprint Backlog

Tài liệu này ghi nhận các phần đã có bằng chứng trong code nhưng chưa được mô tả rõ trong các sprint hoặc product backlog trước khi cập nhật.

## Đã bổ sung vào Product Backlog

| Backlog ID | Tính năng | Bằng chứng trong code | Sprint đề xuất |
| :-- | :-- | :-- | :-- |
| 45 | Saved Posts - lưu bài viết vào bộ sưu tập cá nhân | `prisma/schema.prisma` có `SavedPost`; `PostController` có `POST /posts/:id/save`, `GET /posts/saved`; frontend có `socialService.toggleSavePost()` | Sprint 5 hoặc Sprint 6 |
| 46 | Share nội bộ bài viết lên trang cá nhân | `Post` có `isShared`, `sharedFromId`; frontend có `useSocialActions` tạo post share | Sprint 5 |
| 47 | AI feedback Like/Dislike cho gợi ý | `AiFeedback` model; `AiController` có `/ai/feedback`; frontend `ai.service.ts` quản lý feedback | Sprint 4 |
| 48 | Quản lý lịch sử hội thoại AI dài hạn | `Conversation`, `Message`; `AiController` có API conversations; frontend `ai.service.ts` có get/create/delete conversation | Sprint 4 |
| 49 | Merchant Offers/khuyến mãi | `Offer` model; `OfferModule`, `OfferController`; frontend `OffersSection` và tab offers | Sprint 6 hoặc Sprint 7 |
| 50 | Import món ăn hàng loạt bằng Excel | `POST /foods/bulk`; frontend `UploadExcelModal` | Sprint 2 |
| 51 | Import Merchant hàng loạt bằng Excel | `POST /admin/import-merchants`; frontend `AdminImportExcelModal` | Sprint 2 |
| 52 | Operations hardening | Redis cache, retry queue, circuit breaker, budget tracker, structured logger, health probes, AI e2e test | Sprint 7 |

## Ghi chú trạng thái

- Các mục trên đã được thêm vào `product-backlog.md` với ID 45-52.
- Một số tính năng đã có trong sprint task nhưng chưa có user story tương ứng; nếu cần quản lý chặt hơn, nên tạo user story riêng trong sprint phù hợp.
- Sprint 8 hiện mới xác nhận hoàn thành Helmet. CSRF, sanitizer chống XSS chuyên biệt, refresh AI suggestion bằng seed/offset, share ngoài Facebook/Zalo/Web Share API và OG tags vẫn cần làm tiếp.
