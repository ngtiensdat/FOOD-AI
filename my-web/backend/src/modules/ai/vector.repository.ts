// Mục đích: Cung cấp các thao tác tương tác trực tiếp với cơ sở dữ liệu Postgres sử dụng PGVector để lưu trữ và tìm kiếm vector embedding cho món ăn và người dùng.
// File quan hệ: Gọi PrismaService, sử dụng các kiểu từ @prisma/client, và được gọi bởi AiService.
// Chức năng đặc biệt: Thực hiện tìm kiếm hỗn hợp (Hybrid Search) bằng cách kết hợp tương đồng cosine ngữ nghĩa vector (0.8), khoảng cách địa lý (0.1), và các điểm thưởng AdminRecommend, Featured (0.05 mỗi loại) trong một raw query SQL duy nhất để xếp hạng tối ưu.
// Kiến thức/Design Pattern: Hybrid Vector Search, Repository Pattern, PostgreSQL raw query execution, pgvector operations (<=> operator).
// Các biến, hàm đặc biệt: SearchResult (Interface); hybridSearch(), updateFoodEmbedding(), updateUserEmbedding().

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FoodStatus } from '@prisma/client';

export interface SearchResult {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  restaurantName: string;
  address: string;
  lat: number;
  lng: number;
  similarity: number;
}

@Injectable()
export class VectorRepository {
  constructor(private prisma: PrismaService) {}

  async hybridSearch(
    vector: number[],
    userLat?: number,
    userLng?: number,
    limit = 5,
    city?: string,
    district?: string,
  ): Promise<SearchResult[]> {
    const vectorStr = `[${vector.join(',')}]`;

    // Công thức Ranking cải tiến: Đánh giá độ tương thích ngữ nghĩa (Vector Similarity) làm trọng tâm chính (hệ số 0.8),
    // các hệ số thúc đẩy (AdminRecommend, Featured, GeoDistance) chỉ đóng vai trò gia tăng (tie-breaker) tỉ lệ thuận với độ liên quan ngữ nghĩa.
    return this.prisma.$queryRaw<SearchResult[]>`
      SELECT f.id, f.name, f.price, f.description, f.image, r.name as "restaurantName", r.address, f.lat, f.lng, 
            (
              (1 - (f.embedding <=> CAST(${vectorStr} AS vector))) * 0.8 + 
              (1 - (f.embedding <=> CAST(${vectorStr} AS vector))) * (
                (CASE WHEN f.is_admin_recommended THEN 0.05 ELSE 0 END) +
                (CASE WHEN f.is_featured_today THEN 0.05 ELSE 0 END) +
                (CASE 
                  WHEN CAST(${userLat} AS float) IS NOT NULL AND CAST(${userLng} AS float) IS NOT NULL 
                  THEN (1 / (1 + (point(f.lng, f.lat) <-> point(CAST(${userLng} AS float), CAST(${userLat} AS float))))) * 0.1
                  ELSE 0 
                 END)
              )
            ) as similarity
      FROM foods f
      JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_active = true 
        AND r.is_active = true
        AND f.status = ${FoodStatus.APPROVED}
        AND f.embedding IS NOT NULL
        AND (CAST(${city || null} AS text) IS NULL OR r.address ILIKE '%' || CAST(${city || null} AS text) || '%')
        AND (CAST(${district || null} AS text) IS NULL OR r.address ILIKE '%' || CAST(${district || null} AS text) || '%')
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;
  }

  async updateFoodEmbedding(foodId: number, vector: number[]) {
    const vectorStr = `[${vector.join(',')}]`;
    return this.prisma.$executeRaw`
      UPDATE foods SET embedding = CAST(${vectorStr} AS vector) WHERE id = ${foodId}
    `;
  }

  async updateUserEmbedding(userId: number, vector: number[]) {
    const vectorStr = `[${vector.join(',')}]`;
    return this.prisma.$executeRaw`
      UPDATE user_profiles SET embedding = CAST(${vectorStr} AS vector) WHERE user_id = ${userId}
    `;
  }
}
