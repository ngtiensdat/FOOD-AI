const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  let host = process.env.MAIL_HOST;
  let port = parseInt(process.env.MAIL_PORT || '1025', 10);
  let user = process.env.MAIL_USER;
  let pass = process.env.MAIL_PASS;
  let from = process.env.MAIL_FROM || 'noreply@foodai.com';

  console.log('Environment Mail Configuration:');
  console.log('MAIL_HOST:', host);
  console.log('MAIL_PORT:', port);
  console.log('MAIL_USER:', user);
  console.log('MAIL_PASS:', pass ? '********' : '(not set)');
  console.log('MAIL_FROM:', from);

  if (!host || !user || !pass) {
    console.log('\n--- No SMTP credentials found in .env. Creating auto-generated Ethereal test account... ---');
    try {
      const testAccount = await nodemailer.createTestAccount();
      host = testAccount.smtp.host;
      port = testAccount.smtp.port;
      user = testAccount.user;
      pass = testAccount.pass;
      from = `Food AI Test <${testAccount.user}>`;
      console.log('Ethereal Test Account Created:');
      console.log('Host:', host);
      console.log('Port:', port);
      console.log('User:', user);
    } catch (err) {
      console.error('Failed to create Ethereal test account:', err);
      return;
    }
  }

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: from,
    to: 'datga27@gmail.com',
    subject: 'Xác minh tài khoản Food AI (Test OTP)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #FF5E1A; text-align: center;">Xác minh tài khoản Food AI</h2>
        <p>Chào bạn <strong>Dat Nguyen</strong>,</p>
        <p>Để kích hoạt tài khoản của bạn, vui lòng nhập mã OTP dưới đây tại trang xác thực:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="background: #FFF0E6; color: #FF5E1A; border: 1px dashed #FF5E1A; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 30px; border-radius: 8px; display: inline-block;">
            123456
          </span>
        </div>
        <p style="color: #e11d48; font-size: 13px; font-weight: bold;">Lưu ý: Mã OTP này chỉ có hiệu lực trong vòng 5 phút.</p>
      </div>
    `,
  };

  console.log('Sending test email...');
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Response Message ID:', info.messageId);
    
    // Preview URL is only available when sending through an Ethereal account
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL (Ctrl+Click to view the actual email):', previewUrl);
    }
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

run();

