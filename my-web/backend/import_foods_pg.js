const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const foodsPath = path.join(__dirname, 'prisma/foods.json');
  if (!fs.existsSync(foodsPath)) {
    console.error('Không tìm thấy file foods.json');
    return;
  }

  const foodsData = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Đã kết nối Database qua PG...');

  for (const food of foodsData) {
    try {
      // Check duplicate
      const res = await client.query('SELECT id FROM foods WHERE name = $1', [food.name]);
      if (res.rows.length > 0) {
        console.log(`Bỏ qua (đã tồn tại): ${food.name}`);
        continue;
      }

      const query = `
        INSERT INTO foods (name, price, description, image, restaurant_name, address, is_admin_recommended, is_featured_today, status, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'APPROVED', true, NOW())
      `;
      
      await client.query(query, [
        food.name,
        food.price,
        food.description,
        food.image,
        food.restaurantName || null,
        food.address || null,
        food.isAdminRecommended || false,
        food.isFeaturedToday || false
      ]);
      console.log(`Đã nhập thành công: ${food.name}`);
    } catch (err) {
      console.error(`Lỗi khi nhập ${food.name}:`, err.message);
    }
  }

  await client.end();
  console.log('--- HOÀN TẤT ---');
}

main();
