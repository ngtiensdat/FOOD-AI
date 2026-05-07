import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('CẢNH BÁO: OPENAI_API_KEY chưa được thiết lập trong .env');
    } else {
      console.log(`[DEBUG] Đang sử dụng API Key: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);
    }
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
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
    try {
      // 1. Kiểm tra Spam (Tin nhắn quá dài hoặc vớ vẩn)
      if (message.length > 500) {
        return {
          reply: "Hệ thống nhận thấy tin nhắn của bạn quá dài. Vui lòng tóm tắt lại yêu cầu để tôi có thể hỗ trợ tốt nhất nhé! 😊",
          suggestions: []
        };
      }

      if (!process.env.OPENAI_API_KEY) {
        return {
          reply: "Xin lỗi, hệ thống AI hiện đang bảo trì (Thiếu API Key). Vui lòng thử lại sau!",
          suggestions: []
        };
      }

      // 2. Tạo embedding cho câu hỏi của người dùng
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: message,
      });
      const userVector = embeddingResponse.data[0].embedding;

      // 3. Truy xuất sở thích người dùng từ Profile
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId }
      });

      let userPrefContext = '';
      if (profile && profile.preferences) {
        const prefs = profile.preferences as any;
        const prefList: string[] = [];
        
        // Map giải nghĩa chi tiết cho AI
        const goalMap: any = {
          'muscle_gain': 'Tăng cơ (Cần nhiều đạm/protein, carbohydrate phức hợp)',
          'weight_loss': 'Giảm cân (Cần ít calo, nhiều chất xơ, ít đường/tinh bột)',
          'eat_clean': 'Ăn sạch/Eat Clean (Cần thực phẩm tươi, ít chế biến dầu mỡ)',
          'enjoy': 'Thưởng thức ẩm thực (Ưu tiên hương vị ngon, đặc sắc)'
        };

        const cuisineMap: any = {
          'vietnamese': 'Đồ ăn Việt Nam',
          'korean': 'Đồ ăn Hàn Quốc',
          'japanese': 'Đồ ăn Nhật Bản',
          'western': 'Đồ ăn Âu Mỹ'
        };

        if (prefs.goal) prefList.push(`Mục tiêu sức khỏe: ${goalMap[prefs.goal] || prefs.goal}`);
        if (prefs.cuisine) prefList.push(`Gu ẩm thực: ${cuisineMap[prefs.cuisine] || prefs.cuisine}`);
        if (prefs.budget) prefList.push(`Ngân sách: ${prefs.budget}`);
        if (prefs.allergies) prefList.push(`Dị ứng: ${prefs.allergies}`);

        // Kiểm tra nếu có câu trả lời "Khác..."
        Object.keys(prefs).forEach(key => {
          if (typeof prefs[key] === 'string' && prefs[key].startsWith('other:')) {
            prefList.push(`Yêu cầu đặc biệt (${key}): ${prefs[key].replace('other:', '')}`);
          }
        });

        if (prefList.length > 0) {
          userPrefContext = `\nĐÂY LÀ THÔNG TIN QUAN TRỌNG VỀ NGƯỜI DÙNG HIỆN TẠI (Hãy ưu tiên gợi ý dựa trên thông tin này):\n${prefList.join('\n')}\n`;
        }
      }

      // 4. Tìm kiếm món ăn liên quan trong Database (Vector Search)
      const foods: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT f.id, f.name, f.price, f.description, r.name as "restaurantName", r.address, f.map_url as "mapUrl", 1 - (f.embedding <=> $1::vector) as similarity
        FROM foods f
        LEFT JOIN restaurants r ON f.restaurant_id = r.id
        WHERE f.is_active = true AND f.status = 'APPROVED'
        ORDER BY similarity DESC
        LIMIT 3
      `, JSON.stringify(userVector));

      // 5. Chuẩn bị dữ liệu cho AI
      const context = foods.map(f => `${f.name} (Quán: ${f.restaurantName || 'Hệ thống'}, ĐC: ${f.address || 'N/A'}, Giá: ${f.price}đ): ${f.description}`).join('\n');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý ảo chuyên nghiệp Food AI. Nhiệm vụ của bạn là hỗ trợ người dùng tìm món ăn.
            
            QUY TẮC ỨNG XỬ:
            - TUYỆT ĐỐI KHÔNG phản hồi các tin nhắn có từ ngữ dung tục, xúc phạm hoặc nội dung độc hại. Nếu gặp trường hợp này, hãy trả lời ngắn gọn: "Rất tiếc, tôi không thể hỗ trợ các yêu cầu có nội dung không phù hợp. Hãy đặt câu hỏi lịch sự về ẩm thực bạn nhé!"
            - Nếu người dùng cố tình trêu chọc (troll) hoặc hỏi những vấn đề không liên quan đến đồ ăn, hãy lịch sự từ chối và lái câu chuyện quay lại chủ đề ăn uống.
            - Luôn giữ thái độ chuyên nghiệp, thân thiện và hữu ích.

            SỞ THÍCH NGƯỜI DÙNG:
            ${userPrefContext}

            DANH SÁCH MÓN ĂN GỢI Ý:
            ${context}
            
            YÊU CẦU PHẢN HỒI:
            1. Với mỗi món ăn bạn gợi ý, hãy nêu rõ LÝ DO tại sao món đó lại phù hợp với sở thích hoặc mục tiêu sức khỏe của người dùng.
            2. Nếu không có món nào thực sự phù hợp, hãy cứ trả lời thân thiện, giải thích lý do và khuyến khích họ thử các món gần giống nhất.`
          },
          { role: 'user', content: message },
        ],
      });

      return {
        reply: completion.choices[0].message.content,
        suggestions: foods
      };
    } catch (error) {
      console.error('LỖI AI SERVICE:', error);
      return {
        reply: "Xin lỗi, tôi gặp một chút trục trặc khi kết nối với bộ não AI. Bạn hãy thử lại sau giây lát nhé! 😅",
        suggestions: []
      };
    }
  }
}
