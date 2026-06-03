const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.join(__dirname, '../../..');

const fileDescriptions = {
  'prisma/schema.prisma': {
    purpose: 'Định nghĩa cấu trúc cơ sở dữ liệu (Database Schema) bằng Prisma cho toàn bộ hệ thống F&B.',
    relations: 'Sinh ra Prisma Client dùng để truy vấn dữ liệu từ PostgreSQL.',
    features: 'Chứa các model User, Food, Restaurant, Conversation, Message và AiFeedback với các quan hệ và chỉ mục tối ưu.'
  },
  'ai.module.ts': {
    purpose: 'Định nghĩa module NestJS quản lý toàn bộ tính năng và service liên quan đến AI tư vấn ẩm thực.',
    relations: 'Được import vào AppModule và cung cấp các controller và service cần thiết cho AI.'
  },
  'ai.service.ts': {
    purpose: 'Service điều phối chính (Orchestrator) cho các tác vụ AI chat, quản lý trạng thái, và đề xuất món ăn.',
    relations: 'Gọi các service con như IntentDetectorService, RecommendationService, ResponseGeneratorService.'
  },
  'ai-rules.constant.ts': {
    purpose: 'Định nghĩa các hằng số cấu hình quy tắc phân tích ý định và trích xuất thực thể của AI.',
    relations: 'Được sử dụng bởi IntentDetectorService và BusinessRuleEngineService.'
  },
  'food-intent.enum.ts': {
    purpose: 'Định nghĩa các Enum phân loại ý định ẩm thực của người dùng (Cuisine, Budget, Emotion, Companion, etc.).',
    relations: 'Được sử dụng trong các DTO và state của luồng AI.'
  },
  'dialogue-state.interface.ts': {
    purpose: 'Định nghĩa interface mô tả DialogueState lưu trữ thông tin bối cảnh hội thoại chat hiện tại.',
    relations: 'Được sử dụng bởi DialogueStateManagerService và các Prompt Builder.'
  },
  'intent-analyzer.prompt.ts': {
    purpose: 'Định nghĩa prompt và cấu trúc mẫu JSON hướng dẫn AI phân tích ý định và trích xuất slots.',
    relations: 'Được sử dụng bởi IntentDetectorService để gửi truy vấn lên OpenAI.'
  },
  'ai-learning.service.ts': {
    purpose: 'Service quản lý AI Feedback Learning, cập nhật sở thích người dùng và thống kê phản hồi.',
    relations: 'Được gọi từ AiController.submitFeedback và cung cấp thông tin sở thích cho RerankingService.'
  },
  'business-rule-engine.service.ts': {
    purpose: 'Service đánh giá các quy tắc nghiệp vụ F&B (ngân sách, khoảng cách, companion, emotion) để chấm điểm đề xuất.',
    relations: 'Được gọi bởi RerankingService để tinh chỉnh trọng số gợi ý.'
  },
  'conversation-state.service.ts': {
    purpose: 'Service quản lý việc lưu và đọc trạng thái hội thoại (DialogueState) trong database.',
    relations: 'Được gọi bởi DialogueStateManagerService để đồng bộ bối cảnh.'
  },
  'dialogue-state-manager.service.ts': {
    purpose: 'Service quản lý và cập nhật tiến trình Dialogue State (COLLECTING, RECOMMENDED, FEEDBACK).',
    relations: 'Gọi ConversationStateService và cung cấp API trạng thái hội thoại cho AiService.'
  },
  'embedding-cache.service.ts': {
    purpose: 'Service quản lý bộ nhớ đệm (caching) các vector embedding bằng Redis để tối ưu hóa hiệu năng.',
    relations: 'Được sử dụng khi truy vấn tương đồng món ăn.'
  },
  'food-knowledge.service.ts': {
    purpose: 'Service cung cấp kiến thức ẩm thực và lời khuyên sức khỏe cho người dùng dựa trên slots dị ứng và trạng thái.',
    relations: 'Được gọi bởi AiService để đính kèm lời khuyên sức khỏe vào prompt.'
  },
  'food-retrieval.service.ts': {
    purpose: 'Service thực hiện truy vấn và lọc thô món ăn trong CSDL dựa trên các điều kiện lọc cơ bản.',
    relations: 'Được gọi bởi RecommendationService để lấy các món ăn ứng cử.'
  },
  'intent-detector.service.ts': {
    purpose: 'Service thực hiện phân tích ý định và trích xuất thực thể (slots) từ tin nhắn của người dùng sử dụng LLM.',
    relations: 'Được gọi bởi AiService ở đầu luồng hội thoại.'
  },
  'prompt-builder.service.ts': {
    purpose: 'Service chịu trách nhiệm xây dựng prompt hệ thống tổng hợp tất cả bối cảnh khách hàng, dị ứng, địa lý và candidates.',
    relations: 'Được gọi bởi AiService để chuẩn bị prompt gửi lên OpenAI.'
  },
  'recommendation.service.ts': {
    purpose: 'Service quản lý việc tìm kiếm vector tương đồng món ăn và chấm điểm, lọc các đề xuất phù hợp nhất.',
    relations: 'Kết hợp FoodRetrievalService và RerankingService.'
  },
  'redis.service.ts': {
    purpose: 'Service quản lý kết nối và các thao tác Redis (caching, distributed lock, rate limiting).',
    relations: 'Được sử dụng rộng rãi bởi AiService và các service AI khác.'
  },
  'reranking.service.ts': {
    purpose: 'Service chấm điểm lại (Reranking) các món ăn dựa trên GPS, thời tiết, dị ứng, quy tắc nghiệp vụ và feedback học được.',
    relations: 'Được gọi bởi RecommendationService.'
  },
  'response-generator.service.ts': {
    purpose: 'Service gửi prompt hoàn thiện lên OpenAI để sinh phản hồi JSON chuẩn hóa.',
    relations: 'Được gọi bởi AiService ở cuối luồng hội thoại.'
  },
  'AiChatWindow.tsx': {
    purpose: 'Component giao diện chính hiển thị khung chat AI (sidebar danh sách hội thoại, chat feed, config drawer).',
    relations: 'Kết nối custom hook useAiChat và render các sub-component.'
  },
  'ChatFeed.tsx': {
    purpose: 'Component giao diện hiển thị danh sách tin nhắn chat và các thẻ gợi ý món ăn kèm nút feedback.',
    relations: 'Được sử dụng trong AiChatWindow để hiển thị nội dung hội thoại.'
  }
};

function getFilesToAudit() {
  const statusOutput = execSync('git status --porcelain', { cwd: workspaceRoot }).toString();
  const files = [];
  statusOutput.split('\n').forEach(line => {
    if (!line.trim()) return;
    const filePath = line.substring(3).trim();
    if (
      (filePath.startsWith('my-web/backend/src/') || 
       filePath.startsWith('my-web/frontend/src/') ||
       filePath.startsWith('my-web/backend/prisma/')) &&
      (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.prisma') || filePath.endsWith('.js'))
    ) {
      files.push(filePath);
    }
  });
  return files;
}

function generateHeader(filePath) {
  const baseName = path.basename(filePath);
  const info = fileDescriptions[baseName] || {
    purpose: `Định nghĩa module/service/component liên quan đến module AI (${baseName}).`,
    relations: `Được liên kết trong luồng xử lý AI của hệ thống.`
  };

  const isPrisma = filePath.endsWith('.prisma');
  
  let header = '';
  if (isPrisma) {
    header += `// Mục đích: ${info.purpose}\n`;
    if (info.relations) header += `// File quan hệ: ${info.relations}\n`;
    if (info.features) header += `// Chức năng đặc biệt: ${info.features}\n`;
  } else {
    header += `/**\n`;
    header += ` * Mục đích: ${info.purpose}\n`;
    if (info.relations) header += ` * File quan hệ: ${info.relations}\n`;
    if (info.features) header += ` * Chức năng đặc biệt: ${info.features}\n`;
    header += ` */\n`;
  }
  return header;
}

function fixFile(file) {
  const absolutePath = path.join(workspaceRoot, file);
  const content = fs.readFileSync(absolutePath, 'utf8');
  if (content.startsWith('/**') || content.startsWith('// Mục đích') || content.startsWith('//')) {
    return false; // Already has header
  }

  const header = generateHeader(file);
  fs.writeFileSync(absolutePath, header + '\n' + content, 'utf8');
  return true;
}

function main() {
  const files = getFilesToAudit();
  let count = 0;
  files.forEach(file => {
    if (fixFile(file)) {
      console.log(`Added header comment to: ${file}`);
      count++;
    }
  });
  console.log(`\nHoàn thành! Đã thêm bình luận đầu trang cho ${count} tệp tin.`);
}

main();
