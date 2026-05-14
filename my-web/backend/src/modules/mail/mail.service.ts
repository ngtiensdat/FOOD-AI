import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter, SentMessageInfo } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<SentMessageInfo> {
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to,
      subject: 'Xác minh tài khoản của bạn trên Food AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #FF5E1A; text-align: center;">Chào mừng ${name} đến with Food AI!</h2>
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
