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

async function main() {
    console.log("Bắt đầu import dữ liệu...");

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

        if (!restaurant) {
            restaurant = await prisma.restaurant.create({
                data: {
                    name: deliveryDetail.name,
                    address: deliveryDetail.address,
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
