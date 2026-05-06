const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const foodsPath = path.join(__dirname, 'prisma/foods.json');
  if (!fs.existsSync(foodsPath)) {
    console.error('Không tìm thấy file foods.json tại:', foodsPath);
    return;
  }

  const foodsData = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));
  console.log(`Đang nhập ${foodsData.length} món ăn vào database...`);

  for (const food of foodsData) {
    try {
      // Check if food already exists by name to avoid duplicates
      const existing = await prisma.food.findFirst({
        where: { name: food.name }
      });

      if (existing) {
        console.log(`Món ăn đã tồn tại: ${food.name}`);
        continue;
      }

      await prisma.food.create({
        data: {
          ...food,
          status: 'APPROVED',
          isActive: true
        }
      });
      console.log(`Đã nhập: ${food.name}`);
    } catch (err) {
      console.error(`Lỗi khi nhập ${food.name}:`, err.message);
    }
  }

  console.log('--- HOÀN TẤT ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
