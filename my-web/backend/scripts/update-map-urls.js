const { Client } = require('pg');
require('dotenv').config();

const updates = [
  {
    addressPattern: '%129 Nguyễn Thái Học%',
    namePattern: 'MAXI BURGER - Nguyễn Thái Học',
    mapUrl: 'https://maps.app.goo.gl/ZjX9Vxzx4maJVEmM7'
  },
  {
    addressPattern: '%28 Đại Cồ Việt%',
    namePattern: 'Cơm Ngon CÔ TẤM',
    mapUrl: 'https://maps.app.goo.gl/LnpMSmHHVfYw6uJ49'
  },
  {
    addressPattern: '%22 Tô Hiệu%',
    namePattern: 'Bún Chả Cầu Đen - Hà Đông',
    mapUrl: 'https://maps.app.goo.gl/NvfLBJSh7XtDji6y7'
  },
  {
    addressPattern: '%Lương Ngọc Quyến%',
    namePattern: 'Quán Yên Béo - Trà & Nước Ép Trái Cây - Lương Ngọc Quyến',
    mapUrl: 'https://maps.app.goo.gl/BD2GZ2cuQ6ReAeBE8'
  },
  {
    addressPattern: '%28 Phạm Tu%',
    namePattern: 'Cô Ba Chang - Hủ Tiếu Nam Vang, Bún Bò Huế & Nước Sâm 24 Vị - Phạm Tu',
    mapUrl: 'https://maps.app.goo.gl/WDjeV979oK7HJqes7'
  }
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('--- BẮT ĐẦU CẬP NHẬT GOOGLE MAPS LINKS ---');

    for (const update of updates) {
      // 1. Cập nhật bảng restaurants
      const restUpdate = await client.query(
        `UPDATE restaurants 
         SET map_url = $1, updated_at = NOW() 
         WHERE name = $2 OR address LIKE $3 
         RETURNING id, name`,
        [update.mapUrl, update.namePattern, update.addressPattern]
      );

      if (restUpdate.rows.length > 0) {
        const restId = restUpdate.rows[0].id;
        const restName = restUpdate.rows[0].name;
        console.log(`✅ Đã cập nhật Restaurant: "${restName}" (ID: ${restId}) -> ${update.mapUrl}`);

        // 2. Cập nhật bảng foods cho các món ăn thuộc nhà hàng này
        const foodUpdate = await client.query(
          `UPDATE foods 
           SET map_url = $1, updated_at = NOW() 
           WHERE restaurant_id = $2 
           RETURNING id, name`,
          [update.mapUrl, restId]
        );

        console.log(`   👉 Đã cập nhật map_url cho ${foodUpdate.rows.length} món ăn thuộc quán này.`);
      } else {
        console.warn(`⚠️ Không tìm thấy nhà hàng khớp với name: "${update.namePattern}" hoặc address: "${update.addressPattern}"`);
      }
    }

    console.log('--- HOÀN TẤT CẬP NHẬT MAP LINKS ---');
  } catch (err) {
    console.error('Lỗi thực thi:', err);
  } finally {
    await client.end();
  }
}

main();
