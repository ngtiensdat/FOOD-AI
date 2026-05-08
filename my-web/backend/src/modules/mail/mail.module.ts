import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';

@Global() // Đặt làm Global để tất cả các Module khác có thể dùng mà không cần import lại
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
