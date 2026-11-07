/**
 * Script tự động tạo cấu trúc thư mục hình ảnh mẫu cho 100 Nhà hàng & 1.155 Món ăn
 * Thư mục gốc: E:\FOOD_DATASET\img\<email_chu_quan>\<nhom_thuc_don>\<ten_mon>.jpg
 */
const path = require('path');
const fs = require('fs');
const XLSX = require('E:/FOOD_AI_code/node_modules/xlsx');

const excelPath = 'e:/FOOD_AI_code/data-import/nha_hang_va_mon_an_100_quan.xlsx';
const baseImgDir = 'E:/FOOD_DATASET/img';
const templateFile = 'E:/FOOD_DATASET/placeholder-template.jpg';

if (!fs.existsSync(templateFile)) {
  console.error('Không tìm thấy file template:', templateFile);
  process.exit(1);
}

const templateBuffer = fs.readFileSync(templateFile);

if (!fs.existsSync(baseImgDir)) {
  fs.mkdirSync(baseImgDir, { recursive: true });
}

const wb = XLSX.readFile(excelPath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

let currentEmail = '';
let currentRestName = '';

let totalRestCreated = 0;
let totalFoodCreated = 0;
let totalSkipped = 0;

for (const row of rows) {
  if (row.email_chu_quan) {
    currentEmail = String(row.email_chu_quan).trim();
  }
  if (row.ten_quan) {
    currentRestName = String(row.ten_quan).trim();
  }

  if (!currentEmail) continue;

  const restDir = path.join(baseImgDir, currentEmail);
  if (!fs.existsSync(restDir)) {
    fs.mkdirSync(restDir, { recursive: true });
    totalRestCreated++;

    // Tạo file mẫu cho logo và ảnh bìa nếu chưa có
    const logoFile = path.join(restDir, 'logo.jpg');
    if (!fs.existsSync(logoFile)) {
      fs.writeFileSync(logoFile, templateBuffer);
    }
    const coverFile = path.join(restDir, 'cover.jpg');
    if (!fs.existsSync(coverFile)) {
      fs.writeFileSync(coverFile, templateBuffer);
    }
  }

  const foodName = String(row.ten_mon || '').trim();
  if (!foodName) continue;

  const groupName = String(row.nhom_thuc_don || 'Món chính').trim();
  const groupDir = path.join(restDir, groupName);
  if (!fs.existsSync(groupDir)) {
    fs.mkdirSync(groupDir, { recursive: true });
  }

  // Tên file an toàn trên hệ điều hành Windows (thay : * ? " < > | bằng -)
  const safeFileName = foodName.replace(/[\\/:*?"<>|]/g, '-').trim() + '.jpg';
  const foodFilePath = path.join(groupDir, safeFileName);

  if (fs.existsSync(foodFilePath)) {
    // Đã có file (ví dụ ảnh người dùng tự tạo trước) -> KHÔNG GHI ĐÈ
    totalSkipped++;
  } else {
    fs.writeFileSync(foodFilePath, templateBuffer);
    totalFoodCreated++;
  }
}

console.log('========================================================');
console.log('🎉 ĐÃ HOÀN TẤT KHỞI TẠO THƯ MỤC VÀ ẢNH MẪU CHO TẤT CẢ QUÁN!');
console.log('========================================================');
console.log(`📁 Thư mục gốc: ${baseImgDir}`);
console.log(`🏢 Số thư mục nhà hàng (theo email): 100 quán`);
console.log(`🍲 Số ảnh món ăn mẫu vừa tạo mới: ${totalFoodCreated}`);
console.log(`⏭️ Số ảnh đã tồn tại trước (không ghi đè): ${totalSkipped}`);

