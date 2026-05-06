import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getEmbedding(text: string) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async chat(userId: number, message: string) {
    // 1. Tạo embedding cho câu hỏi của người dùng
    const embeddingResponse = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });
    const userVector = embeddingResponse.data[0].embedding;

    // 2. Tìm kiếm món ăn liên quan trong Database (Vector Search)
    const foods: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, name, price, description, restaurant_name as "restaurantName", address, map_url as "mapUrl", 1 - (embedding <=> $1::vector) as similarity
      FROM foods
      WHERE is_active = true AND status = 'APPROVED'
      ORDER BY similarity DESC
      LIMIT 3
    `, JSON.stringify(userVector));

    // 3. Chuẩn bị dữ liệu cho AI
    const context = foods.map(f => `${f.name} (Quán: ${f.restaurantName || 'N/A'}, ĐC: ${f.address || 'N/A'}, Giá: ${f.price}đ): ${f.description}`).join('\n');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bạn là trợ lý ảo Food AI. Hãy giúp người dùng chọn món ăn dựa trên sở thích/tâm trạng của họ. 
          Dưới đây là các món ăn có sẵn trong hệ thống mà bạn có thể gợi ý:
          ${context}
          Nếu không có món nào thực sự phù hợp, hãy cứ trả lời thân thiện và khuyến khích họ thử các món khác.`
        },
        { role: 'user', content: message },
      ],
    });

    return {
      reply: completion.choices[0].message.content,
      suggestions: foods
    };
  }
}
