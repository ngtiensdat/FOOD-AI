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

  async sendVerificationOtpEmail(
    to: string,
    name: string,
    otp: string,
  ): Promise<SentMessageInfo> {
    const config = appConfig();
    const mailOptions = {
      from: config.mailFrom,
      to,
      subject: MESSAGES.MAIL.VERIFICATION_OTP_SUBJECT,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #FF5E1A; text-align: center;">Xác minh tài khoản Food AI</h2>
          <p>Chào bạn <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Food AI. Để kích hoạt tài khoản của bạn, vui lòng nhập mã OTP dưới đây tại trang xác thực:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background: #FFF0E6; color: #FF5E1A; border: 1px dashed #FF5E1A; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 30px; border-radius: 8px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="color: #e11d48; font-size: 13px; font-weight: bold;">Lưu ý: Mã OTP này chỉ có hiệu lực trong vòng 5 phút.</p>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Nếu bạn không yêu cầu đăng ký này, bạn có thể bỏ qua email này an toàn.</p>
        </div>
      `,
    };

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.warn('Gửi email OTP thất bại. Fallback log OTP:', otp);
      console.error(error);
      return { messageId: 'fallback-logged-console' };
    }
  }

  async sendResetPasswordOtpEmail(
    to: string,
    name: string,
    otp: string,
  ): Promise<SentMessageInfo> {
    const config = appConfig();
    const mailOptions = {
      from: config.mailFrom,
      to,
      subject: MESSAGES.MAIL.RESET_PASSWORD_SUBJECT,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #FF5E1A; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
          <p>Chào bạn <strong>${name}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Food AI. Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc đặt lại mật khẩu:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background: #FFF0E6; color: #FF5E1A; border: 1px dashed #FF5E1A; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 30px; border-radius: 8px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="color: #e11d48; font-size: 13px; font-weight: bold;">Lưu ý: Mã OTP này chỉ có hiệu lực trong vòng 5 phút.</p>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ.</p>
        </div>
      `,
    };

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.warn(
        'Gửi email Reset Password OTP thất bại. Fallback log OTP:',
        otp,
      );
      console.error(error);
      return { messageId: 'fallback-logged-console' };
    }
  }
}
