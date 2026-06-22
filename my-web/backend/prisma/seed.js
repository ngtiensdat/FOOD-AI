const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// 1. Tạo Pool kết nối
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Khởi tạo Prisma với Adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- ĐANG KHỞI TẠO DỮ LIỆU HỆ THỐNG ---');

  const adminPassword = await bcrypt.hash('admin123456', 10);

  // 1. Tạo/Cập nhật Admin mặc định
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@gmail.com',
      name: 'Quản trị viên tối cao',
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
      bio: 'Quản trị viên cấp cao của hệ thống Food AI'
    }
  });
  console.log(`- Đã khởi tạo Admin: ${admin.email}`);

  // 2. Khởi tạo Voucher mẫu
  console.log('- Đang khởi tạo Vouchers...');
  const vouchersData = [
    {
      code: 'VOUCHER10',
      title: 'Giảm 10k',
      description: 'Giảm 10k cho đơn hàng từ 50k',
      pointsCost: 100,
      discountValue: '10,000đ',
      minSpend: '50,000đ',
      expiryDays: 30
    },
    {
      code: 'VOUCHER20',
      title: 'Giảm 20k',
      description: 'Giảm 20k cho đơn hàng từ 100k',
      pointsCost: 200,
      discountValue: '20,000đ',
      minSpend: '100,000đ',
      expiryDays: 30
    },
    {
      code: 'VOUCHER50',
      title: 'Giảm 50k',
      description: 'Giảm 50k cho đơn hàng từ 200k',
      pointsCost: 500,
      discountValue: '50,000đ',
      minSpend: '200,000đ',
      expiryDays: 30
    }
  ];

  for (const v of vouchersData) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: v,
      create: v
    });
  }

  // 3. Khởi tạo Offer mẫu
  console.log('- Đang khởi tạo Offers...');
  const offersData = [
    {
      title: 'Giảm 30% cho khách hàng mới',
      description: 'Khuyến mại lớn nhất tháng này của quán Bánh mì Kim Oanh',
      promoType: 'DISCOUNT',
      discountValue: '30%',
      restaurantName: 'Bánh Mì Kim Oanh',
      image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60',
      validUntil: '30/06/2026'
    },
    {
      title: 'Mua 1 Tặng 1 Trà Sữa Thái',
      description: 'Chương trình mua 1 tặng 1 khi order đồ uống',
      promoType: 'GIFT',
      discountValue: 'Mua 1 Tặng 1',
      restaurantName: 'Bánh Mì Kim Oanh',
      image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60',
      validUntil: '25/06/2026'
    }
  ];

  for (const o of offersData) {
    const existing = await prisma.offer.findFirst({
      where: { title: o.title, restaurantName: o.restaurantName }
    });
    if (!existing) {
      await prisma.offer.create({ data: o });
    }
  }

  // 4. Khởi tạo BadgeConfig mẫu với các điều kiện nâng cấp mới
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
    const existing = await prisma.badgeConfig.findFirst({
      where: { role: bc.role, title: bc.title }
    });
    if (!existing) {
      await prisma.badgeConfig.create({ data: bc });
    } else {
      // Cập nhật lại các điều kiện nếu đã có
      await prisma.badgeConfig.update({
        where: { id: existing.id },
        data: bc
      });
    }
  }

  // 5. Khởi tạo GamificationConfig mặc định
  console.log('- Đang khởi tạo GamificationConfig...');
  await prisma.gamificationConfig.upsert({
    where: { id: 'singleton' },
    update: {
      levelUpPointsReward: 100
    },
    create: {
      id: 'singleton',
      pointsPerLevel: 1000,
      postReviewPoints: 50,
      commentPoints: 10,
      likePoints: 5,
      deductionMultiplier: 1.0,
      levelUpPointsReward: 100
    }
  });

  console.log('--- HOÀN TẤT: HỆ THỐNG ĐÃ SẴN SÀNG ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
