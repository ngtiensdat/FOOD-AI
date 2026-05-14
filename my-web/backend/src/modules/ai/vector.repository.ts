import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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
  ): Promise<SearchResult[]> {
    const vectorStr = `[${vector.join(',')}]`;

    // Công thức Ranking: Vector(0.6) + AdminRecommend(0.1) + Featured(0.1) + GeoDistance(0.2)
    return this.prisma.$queryRaw<SearchResult[]>`
      SELECT f.id, f.name, f.price, f.description, f.image, r.name as "restaurantName", r.address, f.lat, f.lng, 
            (
              (1 - (f.embedding <=> CAST(${vectorStr} AS vector))) * 0.6 + 
              (CASE WHEN f.is_admin_recommended THEN 0.1 ELSE 0 END) +
              (CASE WHEN f.is_featured_today THEN 0.1 ELSE 0 END) +
              (CASE 
                WHEN CAST(${userLat} AS float) IS NOT NULL AND CAST(${userLng} AS float) IS NOT NULL 
                THEN (1 / (1 + (point(f.lng, f.lat) <-> point(CAST(${userLng} AS float), CAST(${userLat} AS float))))) * 0.2
                ELSE 0 
               END)
            ) as similarity
      FROM foods f
      JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_active = true 
        AND r.is_active = true
        AND f.status = 'APPROVED'
        AND f.embedding IS NOT NULL
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
