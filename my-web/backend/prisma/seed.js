const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- ĐANG KHỞI TẠO DỮ LIỆU HỆ THỐNG ---');

  // 1. Tạo Admin mặc định
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: adminPassword, role: 'ADMIN', status: 'APPROVED', isEmailVerified: true },
    create: {
      email: 'admin@gmail.com',
      name: 'Quản trị viên',
      password: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      isEmailVerified: true,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      fullName: 'Admin FoodAI',
      bio: 'Quản trị viên cấp cao của hệ thống Food AI',
      hasCompletedOnboarding: true,
    },
  });
  console.log(`✅ Admin: ${admin.email} (password: admin123456)`);

  // 2. BadgeConfig
  console.log('- Đang khởi tạo BadgeConfigs...');
  const badgeConfigsData = [
    { role: 'CUSTOMER', title: 'Người mới', points: 0 },
    { role: 'CUSTOMER', title: 'Người sành ăn', points: 100 },
    { role: 'CUSTOMER', title: 'Thực thần Đồng', points: 300 },
    { role: 'CUSTOMER', title: 'Thực thần Bạc', points: 600 },
    { role: 'CUSTOMER', title: 'Thực thần Vàng', points: 1000 },
    { role: 'CUSTOMER', title: 'Thánh review', points: 3000, minReviews: 10, minPostLikes: 500, minFollowers: 50 },
    { role: 'CUSTOMER', title: 'Chiến thần review', points: 10000, minReviews: 100, minFollowers: 1000, minPostLikes: 1000 },
    { role: 'RESTAURANT', title: 'Cửa hàng Mới', points: 0 },
    { role: 'RESTAURANT', title: 'Cửa hàng được nhiều người biết đến', points: 500, minFollowers: 100 },
    { role: 'RESTAURANT', title: 'Cửa hàng Uy tín', points: 2000, minRatingAvg: 4.5, minRatingCount: 100 },
    { role: 'RESTAURANT', title: 'Cửa hàng Đối tác tin cậy', points: 10000, minRatingAvg: 4.8, minRatingCount: 500 },
    { role: 'RESTAURANT', title: 'Chuẩn mi che lin', points: 20000, minRatingAvg: 4.9, minRatingCount: 1000 },
  ];

  for (const bc of badgeConfigsData) {
    const existing = await prisma.badgeConfig.findFirst({ where: { role: bc.role, title: bc.title } });
    if (!existing) {
      await prisma.badgeConfig.create({ data: bc });
    } else {
      await prisma.badgeConfig.update({ where: { id: existing.id }, data: bc });
    }
  }
  console.log('✅ BadgeConfigs đã khởi tạo');

  // 3. GamificationConfig
  await prisma.gamificationConfig.upsert({
    where: { id: 'singleton' },
    update: { levelUpPointsReward: 100 },
    create: {
      id: 'singleton',
      pointsPerLevel: 1000,
      postReviewPoints: 50,
      commentPoints: 10,
      likePoints: 5,
      deductionMultiplier: 1.0,
      levelUpPointsReward: 100,
    },
  });
  console.log('✅ GamificationConfig đã khởi tạo');

  // 4. Voucher mẫu hệ thống
  console.log('- Đang khởi tạo Vouchers hệ thống...');
  const vouchersData = [
    { code: 'WELCOME10K', title: 'Chào mừng - Giảm 10k', description: 'Giảm 10,000đ cho đơn từ 50k', pointsCost: 100, discountValue: '10,000đ', minSpend: '50,000đ', expiryDays: 30 },
    { code: 'SAVE20K', title: 'Tiết kiệm 20k', description: 'Giảm 20,000đ cho đơn từ 100k', pointsCost: 200, discountValue: '20,000đ', minSpend: '100,000đ', expiryDays: 30 },
    { code: 'BIG50K', title: 'Đại tiệc 50k', description: 'Giảm 50,000đ cho đơn từ 200k', pointsCost: 500, discountValue: '50,000đ', minSpend: '200,000đ', expiryDays: 30 },
    { code: 'MEGA20PCT', title: 'Giảm 20% đơn lớn', description: 'Giảm 20% tối đa không giới hạn', pointsCost: 300, discountValue: '20%', minSpend: '150,000đ', expiryDays: 14 },
  ];

  for (const v of vouchersData) {
    await prisma.voucher.upsert({ where: { code: v.code }, update: v, create: v });
  }
  console.log('✅ Vouchers hệ thống đã khởi tạo');

  console.log('\n========================================');
  console.log('🎉 HỆ THỐNG ĐÃ SẴN SÀNG HOẠT ĐỘNG!');
  console.log('========================================');
  console.log('📧 Email admin: admin@gmail.com');
  console.log('🔑 Mật khẩu  : admin123456');
  console.log('========================================\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
