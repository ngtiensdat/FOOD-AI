import { Controller, Get, Post, Body, Query, Patch, Param } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('foods')
export class FoodController {
  constructor(private prisma: PrismaService) { }

  @Get()
  async getAllFoods(@Query('tag') tag?: string) {
    const foods = await this.prisma.food.findMany({
      where: { isActive: true, status: 'APPROVED' },
      include: {
        restaurant: {
          select: { name: true, address: true, ownerId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    if (tag) {
      const searchTags = tag.split(',').map(t => t.trim().toLowerCase()).filter(t => t);

      return foods.filter(food => {
        const foodTagsLower = food.tags.map(t => t.toLowerCase());
        return searchTags.every(st => foodTagsLower.includes(st));
      }).slice(0, 20);
    }

    return foods.slice(0, 20);
  }

  @Get('featured-today')
  async getFeaturedToday() {
    return this.prisma.food.findMany({
      where: { isFeaturedToday: true, isActive: true, status: 'APPROVED' },
      include: {
        restaurant: {
          select: { name: true, address: true, ownerId: true }
        }
      },
      take: 12
    });
  }

  @Get('featured-weekly')
  async getFeaturedWeekly() {
    return this.prisma.food.findMany({
      where: { isFeaturedWeekly: true, isActive: true, status: 'APPROVED' },
      include: {
        restaurant: {
          select: { name: true, address: true, ownerId: true }
        }
      },
      take: 12
    });
  }

  @Get('recommended')
  async getRecommendedFoods() {
    return this.prisma.food.findMany({
      where: { isAdminRecommended: true, isActive: true, status: 'APPROVED' },
      include: {
        restaurant: {
          select: { name: true, address: true, ownerId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });
  }

  @Get('nearby')
  async getNearbyFoods(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '10'
  ) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const rad = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng)) return [];

    // Lấy ID món ăn thỏa mãn điều kiện khoảng cách
    const nearbyResults: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, 
        (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) + sin(radians($1)) * sin(radians(lat)))) AS distance
      FROM foods
      WHERE is_active = true 
        AND status = 'APPROVED' 
        AND lat IS NOT NULL 
        AND lng IS NOT NULL
        AND (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) + sin(radians($1)) * sin(radians(lat)))) <= $3
      ORDER BY distance ASC
      LIMIT 12
    `, userLat, userLng, rad);

    if (nearbyResults.length === 0) return [];

    // Fetch thông tin đầy đủ kèm quan hệ restaurant
    const foods = await this.prisma.food.findMany({
      where: { id: { in: nearbyResults.map(r => r.id) } },
      include: {
        restaurant: {
          select: { name: true, address: true, ownerId: true }
        }
      }
    });

    // Map lại distance
    return foods.map(f => ({
      ...f,
      distance: nearbyResults.find(r => r.id === f.id)?.distance
    })).sort((a, b) => a.distance - b.distance);
  }

  @Patch(':id/recommend')
  async toggleRecommendFood(@Param('id') id: string) {
    const food = await this.prisma.food.findUnique({
      where: { id: parseInt(id) }
    });

    if (!food) throw new Error('Món ăn không tồn tại');

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
          { restaurant: { name: { contains: query, mode: 'insensitive' } } },
          { restaurant: { address: { contains: query, mode: 'insensitive' } } }
        ],
        isActive: true,
        status: 'APPROVED'
      },
      include: {
        restaurant: {
          select: { name: true, address: true, ownerId: true }
        }
      },
      take: 20
    });
  }

  @Post()
  async createFood(@Body() body: any) {
    const { name, price, description, image, tags, userId, restaurantId, lat, lng } = body;

    let finalRestaurantId: number | null = null;
    if (restaurantId) {
      finalRestaurantId = parseInt(restaurantId);
    } else if (userId) {
      const restaurant = await this.prisma.restaurant.findFirst({
        where: { ownerId: parseInt(userId) }
      });
      if (restaurant) finalRestaurantId = restaurant.id;
    }

    return this.prisma.food.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        image,
        tags: tags || [],
        restaurantId: finalRestaurantId,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        status: 'PENDING',
        isActive: true
      }
    });
  }
}
