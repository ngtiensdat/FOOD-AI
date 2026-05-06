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
    console.log('--- ĐANG CẬP NHẬT DATABASE & TAGS ---');

    for (const food of foodsData) {
      console.log(`Đang xử lý: ${food.name}...`);
      
      // Tạo text để AI đọc và tạo vector (chỉ tạo nếu API Key hợp lệ)
      const contextText = `${food.name}. ${food.restaurantName || ''}. ${food.description}`;
      const embedding = await getEmbedding(contextText);
      const vectorStr = embedding ? `[${embedding.join(',')}]` : null;

      // Check if food exists (Matching both name and restaurantName)
      const res = await client.query('SELECT id FROM foods WHERE name = $1 AND restaurant_name = $2', [food.name, food.restaurantName || null]);
      
      if (res.rows.length > 0) {
        // Update
        const foodId = res.rows[0].id;
        const params = [
          food.price, food.description, food.image, 
          food.restaurantName || null, food.address || null, 
          food.isAdminRecommended || false, food.isFeaturedToday || false,
          food.mapUrl || null,
          food.tags || [],
          food.lat || null,
          food.lng || null,
          food.restaurantId || null
        ];

        let updateQuery = `
          UPDATE foods 
          SET price = $1, description = $2, image = $3, restaurant_name = $4, address = $5, 
              is_admin_recommended = $6, is_featured_today = $7, map_url = $8, tags = $9, 
              lat = $10, lng = $11, restaurant_id = $12
        `;

        if (vectorStr) {
          updateQuery += `, embedding = $13::vector WHERE id = $14`;
          params.push(vectorStr, foodId);
        } else {
          updateQuery += ` WHERE id = $13`;
          params.push(foodId);
        }

        await client.query(updateQuery, params);
        console.log(`[Cập nhật] ${food.name} (Tọa độ: ${food.lat}, ${food.lng})`);
      } else {
        // Insert
        // Xây dựng danh sách tham số động để tránh lỗi lệch index ($1, $2...)
        const params = [
          food.name, food.price, food.description, food.image, 
          food.restaurantName || null, food.address || null, 
          food.mapUrl || null,
          food.tags || [],
          food.isAdminRecommended || false,
          food.isFeaturedToday || false,
          food.lat || null,
          food.lng || null,
          food.restaurantId || null
        ];

        let insertQuery = `
          INSERT INTO foods (
            name, price, description, image, restaurant_name, address, map_url, 
            tags, is_admin_recommended, is_featured_today, lat, lng, restaurant_id,
            status, is_active, created_at
            ${vectorStr ? ', embedding' : ''}
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'APPROVED', true, NOW()
            ${vectorStr ? `, $${params.length + 1}::vector` : ''}
          )
        `;
        
        if (vectorStr) params.push(vectorStr);

        await client.query(insertQuery, params);
        console.log(`[Thêm mới] ${food.name} (Tọa độ: ${food.lat}, ${food.lng})`);
      }
    }
    console.log('--- HOÀN TẤT: DỮ LIỆU ĐÃ ĐƯỢC CẬP NHẬT ---');
  } catch (err) {
    console.error('Lỗi thực thi:', err.message);
  } finally {
    await client.end();
  }
}

main();
