// Mục đích: Khai báo module gửi thư điện tử (MailModule), cấu hình làm Global Module để các module khác dễ dàng sử dụng.
// File quan hệ: Cung cấp và export MailService.
// Chức năng đặc biệt: Đặt decorator @Global() để biến module thành toàn cục, cho phép các module khác (như AuthModule) gọi MailService trực tiếp mà không cần khai báo lại imports.
// Kiến thức/Design Pattern: NestJS Global Module Pattern, Dependency Injection.
// Các biến, hàm đặc biệt: Class MailModule.

import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';

@Global() // Đặt làm Global để tất cả các Module khác có thể dùng mà không cần import lại
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
