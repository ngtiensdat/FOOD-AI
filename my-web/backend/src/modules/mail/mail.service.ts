// Mục đích: Cung cấp dịch vụ gửi thư điện tử sử dụng thư viện Nodemailer kết nối với SMTP server cấu hình qua biến môi trường.
// File quan hệ: Sử dụng các biến cấu hình hệ thống (.env) và được gọi bởi các module cần gửi email xác thực/thông báo (như AuthModule).
// Chức năng đặc biệt: Tự động khởi tạo kết nối SMTP, xây dựng tiêu đề và nội dung HTML của email xác minh tài khoản người dùng có chèm mã xác minh (token).
// Kiến thức/Design Pattern: SMTP Integration, Adapter Pattern (Nodemailer Transporter wrapper), Dependency Injection, SOLID (Single Responsibility).
// Các biến, hàm đặc biệt: transporter (Nodemailer Transporter); sendVerificationEmail().

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter, SentMessageInfo } from 'nodemailer';
import { MESSAGES } from '../../common/constants/messages.constant';
import { appConfig } from '../../config/app.config';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor() {
    const config = appConfig();
    this.transporter = nodemailer.createTransport({
      host: config.mailHost,
      port: config.mailPort,
      auth: {
        user: config.mailUser,
        pass: config.mailPass,
      },
    });
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<SentMessageInfo> {
    const config = appConfig();
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: config.mailFrom,
      to,
      subject: MESSAGES.MAIL.VERIFICATION_SUBJECT,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #FF5E1A; text-align: center;">Chào mừng ${name} đến với Food AI!</h2>
          <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất việc đăng ký, vui lòng nhấn vào nút dưới đây để xác minh email:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #FF5E1A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Xác minh Email ngay
            </a>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này.</p>
        </div>
      `,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}
