const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error('Lỗi tạo Vector (OpenAI):', err.message);
    return null;
  }
}

async function main() {
  const foodsPath = path.join(__dirname, '../prisma/foods.json');
  if (!fs.existsSync(foodsPath)) {
    console.error('Không tìm thấy file foods.json');
    return;
  }

  const foodsData = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- ĐANG CẬP NHẬT DATABASE & CHUẨN HÓA QUAN HỆ ---');

    // 0. Tạo một User Admin mặc định nếu chưa có
    let adminId = 1;
    const userRes = await client.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('Đang tạo tài khoản Admin mặc định...');
      // Mật khẩu mặc định là Admin123 (đã hash)
      const hashedPassword = '$2b$10$78/VREhH1KjR8P3v.p7Y0eE2N1C1.v9V2v6D6O6A6K6I6T6S6H6E'; 
      const newAdmin = await client.query(
        'INSERT INTO users (email, password, name, role, status, is_email_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
        ['admin@gmail.com', hashedPassword, 'Quản trị viên tối cao', 'ADMIN', 'APPROVED', true]
      );
      adminId = newAdmin.rows[0].id;
    } else {
      adminId = userRes.rows[0].id;
    }

    for (const food of foodsData) {
      console.log(`Đang xử lý: ${food.name}...`);
      
      // 1. Xử lý Nhà hàng (Normalization)
      let finalRestaurantId = null;
      if (food.restaurantName) {
        // Tìm xem nhà hàng này đã tồn tại chưa
        const restRes = await client.query('SELECT id FROM restaurants WHERE name = $1', [food.restaurantName]);
        if (restRes.rows.length > 0) {
          finalRestaurantId = restRes.rows[0].id;
        } else {
          // Tạo mới nhà hàng
          const newRest = await client.query(
            'INSERT INTO restaurants (name, address, latitude, longitude, owner_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id',
            [food.restaurantName, food.address || 'Chưa cập nhật', food.lat || 0, food.lng || 0, adminId]
          );
          finalRestaurantId = newRest.rows[0].id;
          console.log(`[Tạo quán] ${food.restaurantName}`);
        }
      }

      // 2. Tạo vector embedding
      const contextText = `${food.name}. ${food.restaurantName || ''}. ${food.description}`;
      const embedding = await getEmbedding(contextText);
      const vectorStr = embedding ? `[${embedding.join(',')}]` : null;

      // 3. Check if food exists
      const foodCheck = await client.query('SELECT id FROM foods WHERE name = $1 AND restaurant_id IS NOT DISTINCT FROM $2', [food.name, finalRestaurantId]);
      
      if (foodCheck.rows.length > 0) {
        // UPDATE
        const foodId = foodCheck.rows[0].id;
        const params = [
          food.price, food.description, food.image, 
          food.isAdminRecommended || false, food.isFeaturedToday || false, food.isFeaturedWeekly || false,
          food.tags || [], food.lat || null, food.lng || null, finalRestaurantId, foodId
        ];

        let updateQuery = `
          UPDATE foods 
          SET price = $1, description = $2, image = $3, 
              is_admin_recommended = $4, is_featured_today = $5, is_featured_weekly = $6,
              tags = $7, lat = $8, lng = $9, restaurant_id = $10, updated_at = NOW()
        `;

        if (vectorStr) {
          updateQuery += `, embedding = $12::vector WHERE id = $11`;
          params.push(vectorStr);
        } else {
          updateQuery += ` WHERE id = $11`;
        }

        await client.query(updateQuery, params);
        console.log(`[Cập nhật] ${food.name}`);
      } else {
        // INSERT
        const params = [
          food.name, food.price, food.description, food.image, 
          food.tags || [], food.isAdminRecommended || false, food.isFeaturedToday || false, food.isFeaturedWeekly || false,
          food.lat || null, food.lng || null, finalRestaurantId
        ];

        let insertQuery = `
          INSERT INTO foods (
            name, price, description, image, tags, 
            is_admin_recommended, is_featured_today, is_featured_weekly, 
            lat, lng, restaurant_id, status, is_active, created_at, updated_at
            ${vectorStr ? ', embedding' : ''}
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'APPROVED', true, NOW(), NOW()
            ${vectorStr ? `, $${params.length + 1}::vector` : ''}
          )
        `;
        
        if (vectorStr) params.push(vectorStr);

        await client.query(insertQuery, params);
        console.log(`[Thêm mới] ${food.name}`);
      }
    }
    console.log('--- HOÀN TẤT: DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA ---');
  } catch (err) {
    console.error('Lỗi thực thi:', err.stack);
  } finally {
    await client.end();
  }
}

main();
