import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ĐANG KIỂM TRA VÀ KHỞI TẠO DỮ LIỆU GỐC ---');

  const adminPassword = await bcrypt.hash('admin123456', 10);

  // 1. Tạo/Cập nhật Admin
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@gmail.com',
      name: 'Quản trị viên tối cao',
      password: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      isEmailVerified: true,
      profile: {
        create: { fullName: 'Hệ thống Quản trị' }
      }
    },
  });

  // 2. Đọc dữ liệu từ foods.json
  const foodsPath = path.join(__dirname, 'foods.json');
  if (fs.existsSync(foodsPath)) {
    console.log('--- Đang nạp dữ liệu món ăn từ foods.json ---');
    const foodsData = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

    for (const food of foodsData) {
      await prisma.food.create({
        data: {
          ...food,
          status: 'APPROVED',
          isActive: true
        }
      });
    }
    console.log(`--- Đã nạp thành công ${foodsData.length} món ăn ---`);
  } else {
    console.warn('--- Cảnh báo: Không tìm thấy file foods.json ---');
  }

  console.log('--- HOÀN TẤT: DỮ LIỆU ĐÃ SẴN SÀNG ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
