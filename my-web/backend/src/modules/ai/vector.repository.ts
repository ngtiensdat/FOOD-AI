/**
 * Mục đích file này để làm gì: Cung cấp các thao tác tương tác trực tiếp với cơ sở dữ liệu Postgres sử dụng PGVector để lưu trữ và tìm kiếm vector embedding cho món ăn và người dùng.
 * Các file khác hay file này có ý nghĩa như nào: Gọi PrismaService, sử dụng các kiểu từ @prisma/client, và được gọi bởi AiService.
 * Các chức năng đặc biệt: Thực hiện tìm kiếm hỗn hợp (Hybrid Search) bằng cách kết hợp tương đồng cosine ngữ nghĩa vector (0.8), khoảng cách địa lý (0.1), và các điểm thưởng AdminRecommend, Featured (0.05 mỗi loại) trong một raw query SQL duy nhất để xếp hạng tối ưu.
 * Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Hybrid Vector Search, Repository Pattern, PostgreSQL raw query execution, pgvector operations (<=> operator).
 * Các biến, hàm đặc biệt trong file: SearchResult (Interface); hybridSearch(), updateFoodEmbedding(), updateUserEmbedding().
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FoodStatus } from '@prisma/client';

export interface SearchResult {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  tags: string[];
  restaurantName: string;
  address: string;
  lat: number;
  lng: number;
  categoryName: string;
  merchantBadge?: string | null;
  embeddingSimilarity: number;
  distance_km: number | null;
  similarity: number;
}

@Injectable()
export class VectorRepository {
  constructor(
    // eslint-disable-next-line unused-imports/no-unused-vars
    private prisma: PrismaService,
  ) {}

  async hybridSearch(
    vector: number[],
    userLat?: number,
    userLng?: number,
    limit = 5,
    city?: string,
    district?: string,
    categoryFilter: 'FOOD' | 'DRINK' | 'ALL' = 'ALL',
    maxDistanceKm: number | null = null,
    offset = 0,
  ): Promise<SearchResult[]> {
    const vectorStr = `[${vector.join(',')}]`;

    return this.prisma.$queryRaw<SearchResult[]>`
      WITH retrieved_foods AS (
        SELECT f.id, f.name, f.price, f.description, f.image, f.tags,
               r.name as "restaurantName", r.address, f.lat, f.lng,
               c.name as "categoryName",
               u.badge_title as "merchantBadge",
               (1 - (f.embedding <=> CAST(${vectorStr} AS vector))) as "embeddingSimilarity",
               (CASE 
                 WHEN CAST(${userLat} AS float) IS NOT NULL AND CAST(${userLng} AS float) IS NOT NULL AND f.lat IS NOT NULL AND f.lng IS NOT NULL
                 THEN (111.02 * sqrt(power(f.lat - CAST(${userLat} AS float), 2) + power(f.lng - CAST(${userLng} AS float), 2)))
                 ELSE null
                END) as "distance_km"
        FROM foods f
        JOIN restaurants r ON f.restaurant_id = r.id
        LEFT JOIN users u ON r.owner_id = u.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.is_active = true 
          AND r.is_active = true
          AND f.status::text = ${FoodStatus.APPROVED}
          AND f.embedding IS NOT NULL
          AND (CAST(${city || null} AS text) IS NULL OR r.address ILIKE '%' || CAST(${city || null} AS text) || '%')
          AND (CAST(${district || null} AS text) IS NULL OR r.address ILIKE '%' || CAST(${district || null} AS text) || '%')
          -- Lọc danh mục động từ AI
          AND (
            CAST(${categoryFilter} AS text) = 'ALL' OR
            (CAST(${categoryFilter} AS text) = 'DRINK' AND c.name ILIKE '%uống%') OR
            (CAST(${categoryFilter} AS text) = 'FOOD' AND (c.name IS NULL OR c.name NOT ILIKE '%uống%'))
          )
      )
      SELECT id, name, price, description, image, tags, "restaurantName", address, lat, lng, "categoryName", "merchantBadge", "embeddingSimilarity", "distance_km",
             "embeddingSimilarity" as similarity
      FROM retrieved_foods
      WHERE (CAST(${maxDistanceKm} AS float) IS NULL OR "distance_km" IS NULL OR "distance_km" <= CAST(${maxDistanceKm} AS float))
      ORDER BY similarity DESC
      LIMIT ${limit}
      OFFSET ${offset}
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

  async updatePostEmbedding(postId: number, vector: number[]) {
    const vectorStr = `[${vector.join(',')}]`;
    return this.prisma.$executeRaw`
      UPDATE posts SET embedding = CAST(${vectorStr} AS vector) WHERE id = ${postId}
    `;
  }

  async getRecommendedPostIds(
    userVector: number[],
    limit = 10,
    offset = 0,
  ): Promise<number[]> {
    const vectorStr = `[${userVector.join(',')}]`;

    interface RecommendedPostRow {
      id: number;
      similarity: number;
    }

    const rows = await this.prisma.$queryRaw<RecommendedPostRow[]>`
      SELECT id,
             (1 - (embedding <=> CAST(${vectorStr} AS vector))) as similarity
      FROM posts
      WHERE deleted_at IS NULL
        AND status::text = 'APPROVED'
        AND embedding IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return rows.map((r) => r.id);
  }

  async clearFoodEmbedding(foodId: number) {
    return this.prisma.$executeRaw`
      UPDATE foods SET embedding = NULL WHERE id = ${foodId}
    `;
  }

  async clearUserEmbedding(userId: number) {
    return this.prisma.$executeRaw`
      UPDATE user_profiles SET embedding = NULL WHERE user_id = ${userId}
    `;
  }

  async clearPostEmbedding(postId: number) {
    return this.prisma.$executeRaw`
      UPDATE posts SET embedding = NULL WHERE id = ${postId}
    `;
  }
}
