import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function cleanImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.includes('susercontent.com') && url.includes('@')) {
        return url.split('@')[0];
    }
    return url;
}

const KNOWN_LOCATIONS = {
    'Hà Nội': [
        'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy', 'Đống Đa',
        'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông'
    ],
    'Hồ Chí Minh': [
        'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
        'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Tân Bình', 'Tân Phú',
        'Gò Vấp', 'Phú Nhuận', 'Thủ Đức'
    ]
};

function parseLocation(address: string) {
    let city = 'Hà Nội'; // default
    let district: string | null = null;

    if (!address) return { city, district };

    const parts = address.split(',').map(p => p.trim());
    if (parts.length < 2) return { city, district };

    const rawCity = parts[parts.length - 1];
    const rawDistrict = parts[parts.length - 2];

    // Loại bỏ các tiền tố để lấy tên lõi
    const cleanDistrict = rawDistrict.replace(/^(Quận|Q\.|Huyện|H\.|Thị xã|TX\.|Thành phố|TP\.)\s*/i, '').trim();

    // 1. Kiểm tra đối chiếu với danh sách KNOWN_LOCATIONS
    for (const [knownCity, knownDistricts] of Object.entries(KNOWN_LOCATIONS)) {
        if (rawCity.toLowerCase().includes(knownCity.toLowerCase()) || 
           (knownCity === 'Hồ Chí Minh' && rawCity.toUpperCase().includes('HCM'))) {
            city = knownCity;
            
            // Tìm xem district lõi có khớp với danh sách quận của thành phố này không
            const matchedDistrict = knownDistricts.find(d => 
                cleanDistrict.toLowerCase() === d.toLowerCase() || 
                rawDistrict.toLowerCase() === d.toLowerCase() ||
                cleanDistrict.toLowerCase().includes(d.toLowerCase())
            );
            
            district = matchedDistrict || cleanDistrict; // Ưu tiên tên chuẩn, nếu không thì dùng tên lõi
            return { city, district };
        }
    }

    // 2. Fallback nếu không thuộc các thành phố trên
    if (rawCity.includes('Hà Nội')) city = 'Hà Nội';
    else if (rawCity.includes('Hồ Chí Minh') || rawCity.includes('HCM')) city = 'Hồ Chí Minh';
    
    district = cleanDistrict;
    return { city, district };
}

async function main() {
    console.log("Bắt đầu import dữ liệu...");

    // Cập nhật tọa độ cho các món ăn đã import trước đó nhưng thiếu lat/lng
    const updateCount = await prisma.$executeRaw`
        UPDATE foods
        SET lat = r.latitude, lng = r.longitude
        FROM restaurants r
        WHERE restaurant_id = r.id AND (foods.lat IS NULL OR foods.lng IS NULL)
    `;
    console.log(`📌 Đã đồng bộ tọa độ cho ${updateCount} món ăn từ chi nhánh sang.`);

    // Thư mục chứa các dataset (ví dụ: 09-dataset)
    const datasetDir = path.resolve(__dirname, '../../../documents/09-dataset');
    
    if (!fs.existsSync(datasetDir)) {
        console.error(`❌ Không tìm thấy thư mục: ${datasetDir}`);
        return;
    }

    // Quét tất cả các thư mục con bên trong 09-dataset
    const folders = fs.readdirSync(datasetDir).filter(f => fs.statSync(path.join(datasetDir, f)).isDirectory());

    if (folders.length === 0) {
        console.log("👉 Không có thư mục con nào trong 09-dataset.");
        return;
    }

    for (const folder of folders) {
        const detailPath = path.join(datasetDir, folder, 'detail.json');
        const menuPath = path.join(datasetDir, folder, 'menu.json');

        if (!fs.existsSync(detailPath) || !fs.existsSync(menuPath)) {
            console.log(`⚠️ Bỏ qua thư mục "${folder}" vì thiếu detail.json hoặc menu.json`);
            continue;
        }

        console.log(`\n======================================`);
        console.log(`🚀 Đang xử lý: ${folder}`);

        const detailRaw = fs.readFileSync(detailPath, 'utf8');
        const menuRaw = fs.readFileSync(menuPath, 'utf8');

        let detailData, menuData;
        try {
            detailData = JSON.parse(detailRaw);
            menuData = JSON.parse(menuRaw);
        } catch (e) {
            console.error(`❌ Lỗi định dạng JSON ở thư mục ${folder}`);
            continue;
        }

        const deliveryDetail = detailData.reply?.delivery_detail || detailData.delivery_detail;
        const menuInfos = menuData.reply?.menu_infos || menuData.menu_infos;

        if (!deliveryDetail || !menuInfos) {
             console.error(`❌ Cấu trúc JSON không đúng ở thư mục ${folder}`);
             continue;
        }

        // Extract STT từ tên folder (ví dụ "01-Kim Oanh..." -> "01")
        const match = folder.match(/^(\d+)-/);
        const stt = match ? match[1] : '01';
        
        // 1. Tạo một User chủ quán
        const ownerEmail = `merchant${stt}@gmail.com`;
        let owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
        
        if (!owner) {
            // Import bcrypt inside loop or at top, better top but dynamic import works too
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('D12345678', 10);

            owner = await prisma.user.create({
                data: {
                    email: ownerEmail,
                    password: hashedPassword,
                    name: `Chủ Quán ${deliveryDetail.name}`,
                    role: 'RESTAURANT',
                    status: 'APPROVED',
                    profile: {
                        create: {
                            hasCompletedOnboarding: true
                        }
                    }
                }
            });
        }

        // 2. Tạo hoặc Cập nhật Quán ăn
        let restaurant = await prisma.restaurant.findFirst({
            where: { ownerId: owner.id }
        });

        // Lấy ảnh to nhất làm cover
        const coverImageRaw = deliveryDetail.photos && deliveryDetail.photos.length > 0 ? deliveryDetail.photos[deliveryDetail.photos.length - 1].value : null;
        const coverImage = cleanImageUrl(coverImageRaw);

        const locationData = parseLocation(deliveryDetail.address);

        if (!restaurant) {
            restaurant = await prisma.restaurant.create({
                data: {
                    name: deliveryDetail.name,
                    address: deliveryDetail.address,
                    city: locationData.city,
                    district: locationData.district,
                    latitude: deliveryDetail.position.latitude,
                    longitude: deliveryDetail.position.longitude,
                    ownerId: owner.id,
                    isActive: true,
                    profile: {
                        create: {
                            coverImage: coverImage
                        }
                    }
                }
            });
            console.log(`✅ Đã tạo Quán ăn: ${restaurant.name}`);
        } else {
            console.log(`ℹ️ Quán ăn đã tồn tại: ${restaurant.name}`);
        }

        // 3. Lặp qua các danh mục và món ăn
        let totalFoods = 0;

        for (const categoryData of menuInfos) {
            // Tạo CategoryGroup
            const categoryGroup = await prisma.categoryGroup.upsert({
                where: {
                    restaurantId_name: {
                        restaurantId: restaurant.id,
                        name: 'Thực đơn chính'
                    }
                },
                update: {},
                create: {
                    name: 'Thực đơn chính',
                    restaurantId: restaurant.id,
                }
            });

            // Tạo Category
            let category = await prisma.category.findFirst({
                where: { name: categoryData.dish_type_name, groupId: categoryGroup.id }
            });

            if (!category) {
                category = await prisma.category.create({
                    data: {
                        name: categoryData.dish_type_name,
                        groupId: categoryGroup.id,
                    }
                });
                console.log(`  📁 Đã tạo danh mục: ${category.name}`);
            }

            // Tạo Foods
            for (const dish of categoryData.dishes) {
                const imageUrlRaw = dish.photos && dish.photos.length > 0 ? dish.photos[0].value : null;
                const imageUrl = cleanImageUrl(imageUrlRaw);
                
                // Kiểm tra xem món ăn đã tồn tại chưa để tránh trùng lặp nếu chạy 2 lần
                let food = await prisma.food.findFirst({
                    where: { name: dish.name, categoryId: category.id }
                });

                if (!food) {
                    await prisma.food.create({
                        data: {
                            name: dish.name,
                            price: dish.price.value,
                            description: dish.description || null,
                            image: imageUrl,
                            restaurantId: restaurant.id,
                            categoryId: category.id,
                            status: 'APPROVED',
                            isActive: true,
                            city: locationData.city,
                            district: locationData.district,
                            lat: restaurant.latitude,
                            lng: restaurant.longitude,
                        }
                    });
                    totalFoods++;
                }
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã thêm mới ${totalFoods} món ăn vào quán ${restaurant.name}!`);
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
