import { Controller, Get, Post, Body, Query, Patch, Param } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('foods')
export class FoodController {
  constructor(private prisma: PrismaService) { }

  @Get()
  async getAllFoods(@Query('tag') tag?: string) {
    const where: any = { isActive: true, status: 'APPROVED' };

    if (tag) {
      where.tags = { has: tag };
    }

    const foods = await this.prisma.food.findMany({
      where: { isActive: true, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 100 // Lấy nhiều hơn một chút để lọc
    });

    if (tag) {
      const searchTags = tag.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
      
      return foods.filter(food => {
        const foodTagsLower = food.tags.map(t => t.toLowerCase());
        // Phải chứa ĐỦ tất cả các tag được yêu cầu
        return searchTags.every(st => foodTagsLower.includes(st));
      }).slice(0, 20);
    }

    return foods.slice(0, 20);
  }

  @Get('featured-today')
  async getFeaturedToday() {
    return this.prisma.food.findMany({
      where: { isFeaturedToday: true, isActive: true, status: 'APPROVED' },
      take: 4
    });
  }

  @Get('featured-weekly')
  async getFeaturedWeekly() {
    return this.prisma.food.findMany({
      where: { isFeaturedWeekly: true, isActive: true, status: 'APPROVED' },
      take: 4
    });
  }

  @Get('recommended')
  async getRecommendedFoods() {
    return this.prisma.food.findMany({
      where: { isAdminRecommended: true, isActive: true, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: { name: true, address: true }
        }
      },
      take: 4
    });
  }

  @Get('nearby')
  async getNearbyFoods(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '5' // Bán kính mặc định 5km
  ) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const rad = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng)) {
      return [];
    }

    // Sử dụng công thức Haversine để tính khoảng cách trong SQL
    // 6371 là bán kính Trái Đất (km)
    const results: any[] = await this.prisma.$queryRaw`
      SELECT * FROM (
        SELECT *, 
          (6371 * acos(cos(radians(${userLat})) * cos(radians(lat)) * cos(radians(lng) - radians(${userLng})) + sin(radians(${userLat})) * sin(radians(lat)))) AS distance
        FROM foods
        WHERE is_active = true AND status = 'APPROVED' AND lat IS NOT NULL AND lng IS NOT NULL
      ) AS nearby_foods
      WHERE distance <= ${rad}
      ORDER BY distance ASC
      LIMIT 10
    `;

    // Map lại snake_case sang camelCase để khớp với Frontend
    return results.map(item => ({
      ...item,
      mapUrl: item.map_url,
      restaurantName: item.restaurant_name,
      isAdminRecommended: item.is_admin_recommended,
      isFeaturedToday: item.is_featured_today
    }));
  }

  @Patch(':id/recommend')
  async toggleRecommendFood(@Param('id') id: string) {
    const food = await this.prisma.food.findUnique({
      where: { id: parseInt(id) }
    });

    if (!food) {
      throw new Error('Món ăn không tồn tại');
    }

    return this.prisma.food.update({
      where: { id: parseInt(id) },
      data: { isAdminRecommended: !food.isAdminRecommended }
    });
  }

  @Get('search')
  async searchFoods(@Query('q') query: string) {
    if (!query) return [];

    return this.prisma.food.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { restaurantName: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { restaurant: { name: { contains: query, mode: 'insensitive' } } }
        ],
        isActive: true,
        status: 'APPROVED'
      },
      include: {
        restaurant: {
          select: { name: true }
        }
      },
      take: 20
    });
  }
  @Post()
  async createFood(@Body() body: any) {
    const { name, price, description, image, tags, userId, restaurantId, restaurantName, address, mapUrl, lat, lng } = body;

    let finalRestaurantId: number | null = null;

    if (restaurantId) {
      finalRestaurantId = parseInt(restaurantId);
    } else if (userId) {
      // Tự động tìm Quán ăn do user này làm chủ
      const restaurant = await this.prisma.restaurant.findFirst({
        where: { ownerId: parseInt(userId) }
      });
      
      if (restaurant) {
        finalRestaurantId = restaurant.id;
      }
    }

    return this.prisma.food.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        image,
        tags: tags || [],
        restaurantId: finalRestaurantId,
        restaurantName,
        address,
        mapUrl,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        status: 'PENDING', // Mặc định là chờ duyệt
        isActive: true
      }
    });
  }
}
