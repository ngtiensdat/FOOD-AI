import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text: string) {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });
        return response.data[0].embedding;
    } catch (err: unknown) {
        const error = err as Error;
        console.error('❌ Lỗi tạo Vector (OpenAI):', error.message);
        return null;
    }
}

async function main() {
    console.log("🔍 Đang quét các món ăn thiếu Vector Embedding...");

    // Lấy tất cả các món ăn chưa có embedding bằng raw query vì Prisma không có kiểu vector gốc
    const missingFoods = await prisma.$queryRaw<{ id: number; name: string; description: string | null; restaurant_name: string }[]>`
        SELECT f.id, f.name, f.description, r.name as restaurant_name
        FROM foods f
        JOIN restaurants r ON f.restaurant_id = r.id
        WHERE f.embedding IS NULL AND f.is_active = true
    `;

    console.log(`📌 Tìm thấy ${missingFoods.length} món ăn chưa có Vector Gợi ý.`);

    if (missingFoods.length === 0) {
        console.log("✅ Tất cả món ăn đã có đầy đủ Vector Gợi ý.");
        return;
    }

    let successCount = 0;
    for (const food of missingFoods) {
        const contextText = `Món ăn: ${food.name}. Quán: ${food.restaurant_name}. Mô tả: ${food.description || 'Không có mô tả'}.`;
        console.log(`-> Đang tạo Vector cho: "${food.name}"...`);

        const embedding = await getEmbedding(contextText);
        if (embedding) {
            const vectorStr = `[${embedding.join(',')}]`;
            await prisma.$executeRaw`
                UPDATE foods 
                SET embedding = CAST(${vectorStr} AS vector), updated_at = NOW() 
                WHERE id = ${food.id}
            `;
            successCount++;
        }
    }

    console.log(`🎉 HOÀN TẤT! Đã bổ sung thành công ${successCount} Vector Embedding.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
