/**
 * Script tự động đồng bộ ảnh từ Cloudinary vào file Excel và CSDL PostgreSQL
 * Chạy lệnh: npm run sync:images
 */
const path = require('path');
const fs = require('fs');
const XLSX = require('E:/FOOD_AI_code/node_modules/xlsx');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// 1. Cấu hình biến môi trường
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Hàm chuẩn hóa chuỗi để so sánh tên món ăn
function normalizeName(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/_[a-z0-9]{6}$/i, '') // bỏ đuôi random 6 ký tự của Cloudinary ví dụ _iyc9rr
    .replace(/[\(\)\[\]_\s\-]+/g, ' ')
    .trim();
}

async function main() {
  console.log('========================================================');
  console.log('☁️ ĐANG QUÉT ẢNH TỪ CLOUDINARY VÀ ĐỒNG BỘ VÀO EXCEL & CSDL...');
  console.log('========================================================');

  // Lấy danh sách ảnh từ Cloudinary
  let allResources = [];
  try {
    const res = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500,
      direction: 'desc',
    });
    allResources = res.resources || [];
    console.log(`📡 Tìm thấy ${allResources.length} ảnh trên Cloudinary (${process.env.CLOUDINARY_CLOUD_NAME}).\n`);
  } catch (err) {
    console.error('❌ Lỗi khi kết nối Cloudinary API:', err.message);
    process.exit(1);
  }

  // Đọc file Excel
  const dataDir = path.resolve(__dirname, '../../../data-import');
  const excelFile100 = path.join(dataDir, 'nha_hang_va_mon_an_100_quan.xlsx');
  const excelFileDefault = path.join(dataDir, 'nha_hang_va_mon_an.xlsx');

  const targetExcel = fs.existsSync(excelFile100) ? excelFile100 : excelFileDefault;
  if (!fs.existsSync(targetExcel)) {
    console.error(`❌ Không tìm thấy file Excel tại: ${targetExcel}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(targetExcel);
  const sheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  console.log(`📄 Đang xử lý file Excel: ${path.basename(targetExcel)} (${rows.length} dòng)...\n`);

  let matchedCount = 0;
  const updatedFoods = [];

  // Tạo map từ Cloudinary để tra cứu nhanh
  const cldMap = new Map();
  for (const r of allResources) {
    const norm = normalizeName(r.public_id);
    cldMap.set(norm, r.secure_url);
  }

  // Duyệt qua các dòng trong Excel để gán link ảnh
  for (const row of rows) {
    const foodName = String(row.ten_mon || '').trim();
    if (!foodName) continue;

    const normFood = normalizeName(foodName);
    if (cldMap.has(normFood)) {
      const cldUrl = cldMap.get(normFood);
      if (row.link_anh_mon !== cldUrl) {
        row.link_anh_mon = cldUrl;
        matchedCount++;
        updatedFoods.push({ name: foodName, url: cldUrl });
        console.log(`  ✓ Khớp món: "${foodName}" -> ${cldUrl}`);
      }
    }
  }

  if (updatedFoods.length === 0) {
    console.log('ℹ️ Không có ảnh mới nào cần cập nhật. Tất cả link trong Excel đã khớp!');
  } else {
    // 1. Lưu lại vào Excel
    const newWs = XLSX.utils.json_to_sheet(rows);
    wb.Sheets[sheetName] = newWs;
    try {
      XLSX.writeFile(wb, targetExcel);
      console.log(`\n💾 Đã lưu thành công ${updatedFoods.length} link ảnh mới vào file Excel:`);
      console.log(`👉 ${targetExcel}\n`);
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.warn(`⚠️ File Excel đang mở trong Microsoft Excel! Vui lòng đóng Excel lại để lưu được vào file.`);
      } else {
        console.error('❌ Lỗi khi ghi file Excel:', err.message);
      }
    }

    // 2. Cập nhật trực tiếp vào CSDL PostgreSQL
    console.log('🔄 Đang đồng bộ link ảnh mới vào CSDL PostgreSQL...');
    for (const item of updatedFoods) {
      await prisma.food.updateMany({
        where: { name: item.name },
        data: { image: item.url },
      });
      console.log(`  ✅ [CSDL Đã cập nhật] "${item.name}"`);
    }
  }

  console.log('\n========================================================');
  console.log(`🎉 HOÀN TẤT ĐỒNG BỘ: ${updatedFoods.length} MÓN ĐÃ CÓ ẢNH CLOUDINARY!`);
  console.log('========================================================');
}

main()
  .catch((err) => {
    console.error('Lỗi nghiêm trọng:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

