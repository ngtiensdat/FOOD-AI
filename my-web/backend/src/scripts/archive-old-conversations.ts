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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require('@prisma/adapter-pg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function archive() {
  console.log('Bắt đầu quy trình lưu trữ (archiving) hội thoại cũ...');

  // Ngưỡng thời gian: 30 ngày trước
  const thresholdDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  console.log(
    `Tìm các cuộc hội thoại được tạo trước: ${thresholdDate.toISOString()}`,
  );

  const oldConversations = await prisma.conversation.findMany({
    where: {
      createdAt: {
        lt: thresholdDate,
      },
    },
    include: {
      messages: true,
      aiFeedbacks: true,
    },
  });

  if (oldConversations.length === 0) {
    console.log('Không tìm thấy cuộc hội thoại nào cũ hơn 30 ngày để lưu trữ.');
    return;
  }

  console.log(
    `Tìm thấy ${oldConversations.length} cuộc hội thoại cũ. Đang tiến hành lưu trữ...`,
  );

  // Tạo thư mục lưu trữ nếu chưa có
  const archiveDir = path.join(__dirname, '../../archived_conversations');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
    console.log(`Đã tạo thư mục lưu trữ: ${archiveDir}`);
  }

  let archivedCount = 0;

  for (const conv of oldConversations) {
    try {
      const archiveFilename = `conversation_${conv.id}_${conv.createdAt.toISOString().replace(/[:.]/g, '-')}.json`;
      const archivePath = path.join(archiveDir, archiveFilename);

      // Serialize và lưu file JSON
      fs.writeFileSync(archivePath, JSON.stringify(conv, null, 2), 'utf-8');

      // Xóa khỏi Database (tin nhắn và feedbacks liên quan sẽ bị xóa cascade tự động)
      await prisma.conversation.delete({
        where: { id: conv.id },
      });

      archivedCount++;
      if (
        archivedCount % 10 === 0 ||
        archivedCount === oldConversations.length
      ) {
        console.log(
          `Đã lưu trữ thành công: ${archivedCount}/${oldConversations.length} cuộc hội thoại.`,
        );
      }
    } catch (err) {
      console.error(`Lỗi khi lưu trữ cuộc hội thoại ID ${conv.id}:`, err);
    }
  }

  console.log(
    `Hoàn tất quy trình lưu trữ! Tổng cộng đã lưu trữ thành công ${archivedCount} cuộc hội thoại vào thư mục: ${archiveDir}`,
  );
}

archive()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
