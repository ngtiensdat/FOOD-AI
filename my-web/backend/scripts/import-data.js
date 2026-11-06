// @ts-nocheck
// Script nạp dữ liệu từ thư mục data-import (.xlsx) vào PostgreSQL và tạo vector embedding
// Đảm bảo tính Idempotent: Dùng email làm khóa định danh, không tạo thêm nhà hàng hay món ăn đã tồn tại.
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const XLSX = require('xlsx');

// 1. Nạp biến môi trường từ .env
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Khởi tạo OpenAI client nếu có API key
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Hàm tạo vector embedding có retry tự động nếu chạm giới hạn OpenAI
async function createEmbedding(text, retries = 2) {
  if (!openai || !process.env.OPENAI_API_KEY) {
    return null;
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (err) {
      if (attempt < retries && (err.status === 429 || String(err.message).toLowerCase().includes('rate limit'))) {
        console.warn(`  ⏳ [Chạm giới hạn OpenAI] Chờ 2s rồi thử lại lần ${attempt + 1}...`);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.warn(`  [Cảnh báo OpenAI] Không thể tạo vector: ${err.message}`);
        return null;
      }
    }
  }
}

// Đọc dữ liệu từ file Excel .xlsx
function readExcelFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Không tìm thấy file Excel: ${filePath}`);
    return [];
  }
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
}

async function main() {
  console.log('========================================================');
  console.log('🚀 BẮT ĐẦU IMPORT DỮ LIỆU TỪ EXCEL (CHỐNG TRÙNG LẶP)...');
  console.log('========================================================');

  const dataDir = path.resolve(__dirname, '../../../data-import');
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Thư mục không tồn tại: ${dataDir}`);
    return;
  }

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // -------------------------------------------------------------
  // 1. IMPORT KHÁCH HÀNG (khach_hang.xlsx)
  // -------------------------------------------------------------
  const customersPath = path.join(dataDir, 'khach_hang.xlsx');
  if (fs.existsSync(customersPath)) {
    const customers = readExcelFile(customersPath);
    console.log(`\n📌 [1/2] Đang xử lý ${customers.length} khách hàng từ file khach_hang.xlsx...`);

    for (const c of customers) {
      const email = String(c.email || '').trim();
      if (!email) continue;

      try {
        const existingCustomer = await prisma.user.findUnique({
          where: { email },
        });

        if (existingCustomer) {
          console.log(`  ⏭️ [Đã có] Khách hàng ${existingCustomer.name || email} (${email}). Bỏ qua không thêm trùng.`);
          continue;
        }

        const password = String(c.mat_khau || '123456').trim();
        const passwordHash = (password && password !== '123456') ? await bcrypt.hash(password, 10) : defaultPasswordHash;
        const fullName = String(c.ho_ten || 'Khách hàng').trim();
        const phone = String(c.so_dien_thoai || '').trim();
        const address = String(c.dia_chi || '').trim();
        const level = parseInt(c.cap_do, 10) || 1;
        const points = parseInt(c.diem_thuong, 10) || 100;
        const xp = (level - 1) * 1000;
        const badgeTitle = String(c.danh_hieu || '').trim() || null;

        const user = await prisma.user.create({
          data: {
            email,
            password: passwordHash,
            name: fullName,
            role: 'CUSTOMER',
            status: 'APPROVED',
            isEmailVerified: true,
            points,
            xp,
            level,
            highestLevel: Math.max(1, level),
            badgeTitle,
          },
        });

        const preferences = {
          cuisine: String(c.so_thich_am_thuc || 'Đa dạng').trim(),
          goal: String(c.muc_tieu_suc_khoe || 'enjoy').trim(),
          budget: String(c.ngan_sach || 'LinhHoat').trim(),
        };

        await prisma.userProfile.create({
          data: {
            userId: user.id,
            fullName,
            phone,
            address,
            avatar: String(c.anh_dai_dien || '').trim(),
            coverImage: String(c.anh_bia || '').trim(),
            bio: String(c.tieu_su || '').trim(),
            preferences,
            hasCompletedOnboarding: true,
          },
        });

        // Tạo Vector Embedding cho User Profile
        const goalMap = {
          muscle_gain: 'Tăng cơ',
          weight_loss: 'Giảm cân',
          eat_clean: 'Ăn sạch',
          enjoy: 'Thưởng thức ẩm thực',
        };
        const textToEmbed = `Người dùng thích ${preferences.cuisine}. Ngân sách: ${preferences.budget}. Mục tiêu sức khỏe: ${goalMap[preferences.goal] || preferences.goal}.`;
        const vec = await createEmbedding(textToEmbed);
        if (vec) {
          const vecStr = `[${vec.join(',')}]`;
          await prisma.$executeRaw`UPDATE user_profiles SET embedding = CAST(${vecStr} AS vector) WHERE user_id = ${user.id}`;
          console.log(`  ✓ Đã nạp mới & tạo vector hồ sơ: ${fullName} (${email})`);
        } else {
          console.log(`  ✓ Đã nạp mới hồ sơ: ${fullName} (${email})`);
        }
      } catch (err) {
        console.error(`  ❌ Lỗi khi import khách hàng ${email}:`, err.message);
      }
    }
  }

  // -------------------------------------------------------------
  // 2. IMPORT NHÀ HÀNG & MÓN ĂN (Tự động nhận diện file 100 quán)
  // -------------------------------------------------------------
  const rest100Path = path.join(dataDir, 'nha_hang_va_mon_an_100_quan.xlsx');
  const restDefaultPath = path.join(dataDir, 'nha_hang_va_mon_an.xlsx');
  const restPath = fs.existsSync(rest100Path) ? rest100Path : restDefaultPath;
  const rows = readExcelFile(restPath);
  console.log(`\n📌 [2/2] Đang xử lý ${rows.length} dòng nhà hàng & món ăn từ: ${path.basename(restPath)}...`);

  let currentRestaurant = null;
  const restaurantCache = {}; // Cache theo tên quán và email

  for (const row of rows) {
    try {
      const restName = String(row.ten_quan || (currentRestaurant ? currentRestaurant.name : '')).trim();
      if (!restName) continue;

      const ownerEmail = String(row.email_chu_quan || '').trim();

      // Nếu dòng này có email chủ quán hoặc chưa có quán trong cache của lần chạy này
      if (ownerEmail || !restaurantCache[restName]) {
        let email = ownerEmail;
        if (!email && currentRestaurant) {
          email = currentRestaurant.ownerEmail;
        }

        // Tìm chủ quán theo email làm khóa định danh duy nhất (Unique Key)
        let owner = email ? await prisma.user.findUnique({ where: { email } }) : null;
        let restaurant = null;

        if (owner) {
          // Nếu chủ quán đã có trong DB, tìm nhà hàng của chủ quán này
          restaurant = await prisma.restaurant.findFirst({
            where: {
              OR: [
                { ownerId: owner.id },
                { name: restName },
              ],
            },
          });
        } else if (restName) {
          restaurant = await prisma.restaurant.findFirst({
            where: { name: restName },
          });
          if (restaurant) {
            owner = await prisma.user.findUnique({ where: { id: restaurant.ownerId } });
          }
        }

        if (restaurant) {
          // NHÀ HÀNG ĐÃ TỒN TẠI -> KHÔNG TẠO MỚI, CHỈ LẤY LÀM NGỮ CẢNH
          restaurantCache[restName] = restaurant;
          currentRestaurant = restaurant;
          console.log(`\n  🏢 [Đã có sẵn] Nhà hàng: "${restaurant.name}" (${restaurant.address}) - Bỏ qua tạo mới.`);
        } else {
          // NHÀ HÀNG CHƯA CÓ -> TẠO CHỦ QUÁN VÀ TẠO NHÀ HÀNG
          const validEmail = email || `merchant_${Date.now()}@foodai.vn`;
          const pass = String(row.mat_khau_chu_quan || '123456').trim();
          const ownerPasswordHash = (pass && pass !== '123456') ? await bcrypt.hash(pass, 10) : defaultPasswordHash;
          const ownerName = String(row.ten_chu_quan || 'Chủ nhà hàng').trim();

          if (!owner) {
            owner = await prisma.user.create({
              data: {
                email: validEmail,
                password: ownerPasswordHash,
                name: ownerName,
                role: 'RESTAURANT',
                status: 'APPROVED',
                isEmailVerified: true,
              },
            });
          }

          const cuisinesStr = String(row.loai_am_thuc || '');
          const cuisinesArr = cuisinesStr
            ? cuisinesStr.split(',').map((s) => s.trim()).filter(Boolean)
            : [];

          const lat = parseFloat(row.vi_do_lat) || 21.0285;
          const lng = parseFloat(row.kinh_do_lng) || 105.8542;
          const mapUrl = String(row.link_dia_chi_quan || '').trim() || `https://www.google.com/maps?q=${lat},${lng}`;
          const ratingAvg = parseFloat(row.danh_gia_sao) || 4.8;
          const ratingCount = parseInt(row.so_luong_danh_gia, 10) || 35;

          restaurant = await prisma.restaurant.create({
            data: {
              name: restName,
              address: String(row.dia_chi_quan || 'Chưa cập nhật').trim(),
              city: String(row.thanh_pho || 'Hà Nội').trim(),
              district: String(row.quan_huyen || '').trim(),
              latitude: lat,
              longitude: lng,
              mapUrl,
              description: String(row.mo_ta_quan || '').trim(),
              cuisines: cuisinesArr,
              ratingAvg,
              ratingCount,
              ownerId: owner.id,
              isActive: true,
            },
          });

          // Gán restaurantId cho tài khoản chủ quán
          await prisma.user.update({
            where: { id: owner.id },
            data: { restaurantId: restaurant.id },
          });

          // Tạo hồ sơ quán
          await prisma.restaurantProfile.create({
            data: {
              restaurantId: restaurant.id,
              logo: String(row.link_logo_quan || '').trim(),
              coverImage: String(row.link_anh_bia_quan || '').trim(),
              bio: String(row.mo_ta_quan || '').trim(),
              openingHours: String(row.gio_mo_cua || '08:00 - 22:00').trim(),
              contactPhone: String(row.sdt_quan || row.sdt_chu_quan || '').trim(),
              contactEmail: validEmail,
            },
          });

          restaurantCache[restName] = restaurant;
          currentRestaurant = restaurant;
          console.log(`\n  🏢 [Tạo mới] Nhà hàng: "${restaurant.name}" (${restaurant.address}) - ⭐ ${ratingAvg} (${ratingCount} đánh giá)`);
        }
      } else {
        currentRestaurant = restaurantCache[restName];
      }

      // XỬ LÝ MÓN ĂN TRONG QUÁN
      const foodName = String(row.ten_mon || '').trim();
      if (foodName && currentRestaurant) {
        // Kiểm tra món đã tồn tại trong quán chưa
        const existingFood = await prisma.food.findFirst({
          where: {
            restaurantId: currentRestaurant.id,
            name: foodName,
          },
        });

        const newImageLink = String(row.link_anh_mon || '').trim();

        if (existingFood) {
          // Món đã tồn tại: Nếu có điền link ảnh mới và khác link hiện tại -> cập nhật ảnh
          if (newImageLink && newImageLink !== existingFood.image) {
            await prisma.food.update({
              where: { id: existingFood.id },
              data: { image: newImageLink },
            });
            console.log(`    📷 [Cập nhật ảnh] Món: "${foodName}" -> ${newImageLink}`);
          } else {
            // Đã có món -> BỎ QUA KHÔNG THÊM TRÙNG
            console.log(`    ⏭️ [Đã có món] "${foodName}" trong quán "${currentRestaurant.name}". Bỏ qua không thêm trùng.`);
          }
          continue; // Chuyển sang dòng tiếp theo
        }

        // Món CHƯA có -> Tạo mới Category & Food & Vector Embedding
        const groupName = String(row.nhom_thuc_don || 'Thực đơn chính').trim();
        let group = await prisma.categoryGroup.findUnique({
          where: {
            restaurantId_name: {
              restaurantId: currentRestaurant.id,
              name: groupName,
            },
          },
        });
        if (!group) {
          group = await prisma.categoryGroup.create({
            data: {
              name: groupName,
              restaurantId: currentRestaurant.id,
            },
          });
        }

        const catName = String(row.danh_muc || 'Món ăn').trim();
        let category = await prisma.category.findUnique({
          where: {
            groupId_name: {
              groupId: group.id,
              name: catName,
            },
          },
        });
        if (!category) {
          category = await prisma.category.create({
            data: {
              name: catName,
              groupId: group.id,
            },
          });
        }

        const tagsStr = String(row.the_tags || '');
        const tags = tagsStr
          ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
          : [];
        const price = parseFloat(row.gia_tien) || 0;
        const isFeatured = String(row.mon_noi_bat || '').trim().toUpperCase() === 'TRUE';
        const totalOrder = parseInt(row.luot_dat, 10) || (isFeatured ? 65 : 15);
        const totalLike = parseInt(row.luot_thich, 10) || (isFeatured ? 28 : 5);

        const savedFood = await prisma.food.create({
          data: {
            name: foodName,
            price,
            description: String(row.mo_ta_mon || '').trim(),
            image: newImageLink, // Để trống nếu người dùng chưa điền
            tags,
            status: 'APPROVED',
            isActive: true,
            isAdminRecommended: isFeatured,
            isFeaturedToday: isFeatured,
            totalOrder,
            totalLike,
            restaurantId: currentRestaurant.id,
            categoryId: category.id,
            lat: currentRestaurant.latitude,
            lng: currentRestaurant.longitude,
            address: currentRestaurant.address,
            city: currentRestaurant.city,
            district: currentRestaurant.district,
            mapUrl: currentRestaurant.mapUrl,
            calories: parseFloat(row.calo) || 0,
            protein: parseFloat(row.protein) || 0,
            carbs: parseFloat(row.carbs) || 0,
            fat: parseFloat(row.fat) || 0,
          },
        });

        // Tạo Vector Embedding cho món ăn mới
        const displayTags = tags.length > 0 ? tags.join(', ') : 'Không có';
        const textToEmbed = `Danh mục: ${catName}. Món ăn: ${foodName}. Quán: ${currentRestaurant.name}. Giá: ${price.toLocaleString('vi-VN')}đ. Mô tả: ${savedFood.description || 'Đậm đà chuẩn vị'}. Nhãn: ${displayTags}.`;

        const vec = await createEmbedding(textToEmbed);
        if (vec) {
          const vecStr = `[${vec.join(',')}]`;
          await prisma.$executeRaw`UPDATE foods SET embedding = CAST(${vecStr} AS vector) WHERE id = ${savedFood.id}`;
          console.log(`    🍲 [Thêm mới & Vector] ${foodName} - ${price.toLocaleString('vi-VN')}đ`);
        } else {
          console.log(`    🍲 [Thêm mới] ${foodName} - ${price.toLocaleString('vi-VN')}đ`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Lỗi khi xử lý dòng món "${row.ten_mon || row.ten_quan}":`, err.message);
    }
  }

  console.log('\n========================================================');
  console.log('🎉 ĐÃ HOÀN TẤT IMPORT DỮ LIỆU! (KHÔNG BỊ TRÙNG LẶP)');
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
