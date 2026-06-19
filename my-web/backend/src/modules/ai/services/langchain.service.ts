// Mục đích file này để làm gì: Khởi tạo các thực thể LangChain ChatOpenAI và OpenAIEmbeddings để phục vụ cho các tác vụ xử lý ngôn ngữ tự nhiên.
// Các file khác hay file này có ý nghĩa như nào: Được import và sử dụng bởi các dịch vụ AI con (như IntentDetector, ResponseGenerator) và reindex script.
// Các chức năng đặc biệt: Khởi tạo tập trung chatModel và embeddings client từ API key cấu hình.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Dependency Injection, Singleton Pattern (NestJS).
// Các biến, hàm đặc biệt trong file: LangchainService.

import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { appConfig } from '../../../config/app.config';
import { AI_CONSTANTS } from '../../../common/constants/ai.constant';

@Injectable()
export class LangchainService {
  private readonly logger = new Logger(LangchainService.name);
  public readonly chatModel: ChatOpenAI;
  public readonly embeddings: OpenAIEmbeddings;

  constructor() {
    const apiKey = appConfig().openaiApiKey || 'dummy-key';

    this.chatModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: AI_CONSTANTS.MODELS.CHAT,
      temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE,
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: AI_CONSTANTS.MODELS.EMBEDDING,
    });

    this.logger.log('LangchainService initialized successfully.');
  }
}
