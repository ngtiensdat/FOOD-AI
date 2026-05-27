const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LOCATION_DATA = [
  {
    city: 'Hà Nội',
    districts: ['Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông']
  },
  {
    city: 'Hồ Chí Minh',
    districts: ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Tân Bình', 'Tân Phú', 'Gò Vấp', 'Phú Nhuận', 'Thủ Đức']
  }
];

function parseAddress(address) {
  if (!address) return { city: 'Hà Nội', district: 'Cầu Giấy' };
  
  const addrLower = address.toLowerCase();
  
  // Kiểm tra từng quận/huyện
  for (const c of LOCATION_DATA) {
    for (const d of c.districts) {
      if (addrLower.includes(d.toLowerCase())) {
        return { city: c.city, district: d };
      }
    }
  }

  // Fallbacks based on city keywords
  if (addrLower.includes('hồ chí minh') || addrLower.includes('tphcm') || addrLower.includes('hcm') || addrLower.includes('sài gòn')) {
    return { city: 'Hồ Chí Minh', district: 'Quận 1' };
  }

  return { city: 'Hà Nội', district: 'Cầu Giấy' };
}

async function main() {
  console.log('--- BẮT ĐẦU MIGRATION ĐỊA CHỈ ---');

  // 1. Migrate Restaurants
  const restaurants = await prisma.restaurant.findMany();
  console.log(`Tìm thấy ${restaurants.length} nhà hàng cần kiểm tra.`);
  
  let updatedRestaurants = 0;
  for (const r of restaurants) {
    const { city, district } = parseAddress(r.address);
    await prisma.restaurant.update({
      where: { id: r.id },
      data: { city, district }
    });
    updatedRestaurants++;
  }
  console.log(`Đã cập nhật ${updatedRestaurants} nhà hàng.`);

  // 2. Migrate Foods
  const foods = await prisma.food.findMany();
  console.log(`Tìm thấy ${foods.length} món ăn cần kiểm tra.`);

  let updatedFoods = 0;
  for (const f of foods) {
    const { city, district } = parseAddress(f.address || f.restaurant?.address);
    await prisma.food.update({
      where: { id: f.id },
      data: { city, district }
    });
    updatedFoods++;
  }
  console.log(`Đã cập nhật ${updatedFoods} món ăn.`);

  console.log('--- HOÀN TẤT MIGRATION ĐỊA CHỈ ---');
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
