// Mục đích file này để làm gì: Script dòng lệnh CLI dùng để đồng bộ lại toàn bộ vector embeddings cho món ăn và hồ sơ người dùng.
// Các file khác hay file này có ý nghĩa như nào: Được chạy bằng tay hoặc qua cronjob độc lập, lưu các vector vào PostgreSQL.
// Các chức năng đặc biệt: Tích hợp LangChain OpenAIEmbeddings để tạo vector hàng loạt và cập nhật bằng raw SQL query.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Scripting, CLI Pattern.
// Các biến, hàm đặc biệt trong file: reindex() function.

import * as path from 'path';
import * as fs from 'fs';

// Load .env file thủ công từ thư mục backend
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts
        .slice(1)
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

// Import động sau khi đã nạp biến môi trường thành công
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require('@prisma/adapter-pg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require('pg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { OpenAIEmbeddings } = require('@langchain/openai');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  modelName: 'text-embedding-3-small',
});

async function reindex() {
  console.log(
    'Bắt đầu đồng bộ lại vector embedding cho món ăn và người dùng...',
  );

  // 1. Đồng bộ hóa Foods
  console.log('Đang lấy danh sách món ăn...');
  const foods = await prisma.food.findMany({
    include: { category: true },
  });
  console.log(`Tìm thấy ${foods.length} món ăn. Bắt đầu tạo vector...`);

  let successFoods = 0;
  for (const food of foods) {
    try {
      const tagsStr =
        food.tags && food.tags.length > 0 ? food.tags.join(', ') : 'Không có';
      const categoryName = food.category?.name || 'Khác';
      const textToEmbed = `Danh mục: ${categoryName}. Món ăn: ${food.name}. Giá: ${food.price.toLocaleString('vi-VN')}đ. Mô tả: ${food.description || 'Không có mô tả'}. Nhãn: ${tagsStr}.`;

      const embedding = await embeddings.embedQuery(textToEmbed);
      const vectorStr = `[${embedding.join(',')}]`;

      // Cập nhật bằng raw query để truyền vector type
      await prisma.$executeRaw`UPDATE foods SET embedding = CAST(${vectorStr} AS vector) WHERE id = ${food.id}`;
      successFoods++;
      if (successFoods % 5 === 0) {
        console.log(`Đã xử lý xong ${successFoods}/${foods.length} món ăn.`);
      }
    } catch (err) {
      console.error(`Lỗi khi tạo embedding cho món ăn ID ${food.id}:`, err);
    }
  }

  // 2. Đồng bộ hóa Users/UserProfile
  console.log('Đang lấy danh sách hồ sơ người dùng...');
  const profiles = await prisma.userProfile.findMany();
  console.log(
    `Tìm thấy ${profiles.length} hồ sơ người dùng. Bắt đầu tạo vector...`,
  );

  let successProfiles = 0;
  const goalMap: Record<string, string> = {
    muscle_gain: 'Tăng cơ',
    weight_loss: 'Giảm cân',
    eat_clean: 'Ăn sạch',
    enjoy: 'Thưởng thức',
  };

  for (const profile of profiles) {
    try {
      if (!profile.preferences) continue;
      const prefs = profile.preferences as Record<string, string>;
      const goalStr = prefs.goal
        ? goalMap[prefs.goal] || prefs.goal
        : 'Không có';
      const textToEmbed = `Người dùng thích ${prefs.cuisine || 'đa dạng'}. Ngân sách ${prefs.budget || 'linh hoạt'}. Mục tiêu sức khỏe: ${goalStr}.`;

      const embedding = await embeddings.embedQuery(textToEmbed);
      const vectorStr = `[${embedding.join(',')}]`;

      await prisma.$executeRaw`UPDATE user_profiles SET embedding = CAST(${vectorStr} AS vector) WHERE user_id = ${profile.userId}`;
      successProfiles++;
    } catch (err) {
      console.error(
        `Lỗi khi tạo embedding cho người dùng ID ${profile.userId}:`,
        err,
      );
    }
  }

  console.log(
    `Đồng bộ thành công! Đã cập nhật ${successFoods} món ăn và ${successProfiles} hồ sơ người dùng.`,
  );
}

reindex()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
