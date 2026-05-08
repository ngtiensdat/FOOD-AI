import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AuthorizationService } from '../../common/services/authorization.service';
import { UserRole, FoodStatus } from '@prisma/client';

@Controller('foods')
export class FoodController {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private authZ: AuthorizationService,
  ) { }

  @Get()
  async getAllFoods(@Query('tag') tag?: string) {
    const foods = await this.prisma.food.findMany({
      where: {
        isActive: true,
        status: 'APPROVED',
        OR: [
          { restaurantId: null },
          { restaurant: { is: { isActive: true } } },
        ],
      },
      include: {
        restaurant: {
          select: { id: true, name: true, address: true, ownerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (tag) {
      const searchTags = tag
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t);

      return foods
        .filter((food) => {
          const foodTagsLower = food.tags.map((t) => t.toLowerCase());
          return searchTags.every((st) => foodTagsLower.includes(st));
        })
        .slice(0, 20);
    }

    return foods.slice(0, 20);
  }

  @Get('featured-today')
  async getFeaturedToday() {
    return this.prisma.food.findMany({
      where: {
        isFeaturedToday: true,
        isActive: true,
        status: 'APPROVED',
        OR: [
          { restaurantId: null },
          { restaurant: { is: { isActive: true } } },
        ],
      },
      include: {
        restaurant: {
          select: { id: true, name: true, address: true, ownerId: true },
        },
      },
      take: 12,
    });
  }

  @Get('featured-weekly')
  async getFeaturedWeekly() {
    return this.prisma.food.findMany({
      where: {
        isFeaturedWeekly: true,
        isActive: true,
        status: 'APPROVED',
        OR: [
          { restaurantId: null },
          { restaurant: { is: { isActive: true } } },
        ],
      },
      include: {
        restaurant: {
          select: { id: true, name: true, address: true, ownerId: true },
        },
      },
      take: 12,
    });
  }

  @Get('recommended')
  async getRecommendedFoods() {
    return this.prisma.food.findMany({
      where: {
        isAdminRecommended: true,
        isActive: true,
        status: 'APPROVED',
        OR: [
          { restaurantId: null },
          { restaurant: { is: { isActive: true } } },
        ],
      },
      include: {
        restaurant: {
          select: { name: true, address: true, ownerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
  }

  @Get('nearby')
  async getNearbyFoods(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '10',
  ) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const rad = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng)) return [];

    const nearbyResults: any[] = await this.prisma.$queryRaw`
      SELECT f.id, 
        (6371 * acos(cos(radians(${userLat})) * cos(radians(f.lat)) * cos(radians(f.lng) - radians(${userLng})) + sin(radians(${userLat})) * sin(radians(f.lat)))) AS distance
      FROM foods f
      JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_active = true 
        AND r.is_active = true
        AND f.status = 'APPROVED' 
        AND f.lat IS NOT NULL 
        AND f.lng IS NOT NULL
        AND (6371 * acos(cos(radians(${userLat})) * cos(radians(f.lat)) * cos(radians(f.lng) - radians(${userLng})) + sin(radians(${userLat})) * sin(radians(f.lat)))) <= ${rad}
      ORDER BY distance ASC
      LIMIT 12
    `;

    if (nearbyResults.length === 0) return [];

    const foods = await this.prisma.food.findMany({
      where: { id: { in: nearbyResults.map((r) => r.id) } },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,
        tags: true,
        lat: true,
        lng: true,
        address: true,
        mapUrl: true,
        restaurantId: true,
        restaurant: {
          select: { name: true, address: true, ownerId: true },
        },
      } as any,
    });

    return foods
      .map((f) => ({
        ...f,
        distance: nearbyResults.find((r) => r.id === f.id)?.distance,
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  @Patch(':id/recommend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleRecommendFood(@Param('id') id: string) {
    const foodId = parseInt(id);
    const food = await this.prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!food) throw new Error('Món ăn không tồn tại');

    return this.prisma.food.update({
      where: { id: foodId },
      data: { isAdminRecommended: !food.isAdminRecommended },
    });
  }

  @Get('my-foods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getMerchantFoods(@GetUser() user: any) {
    const whereClause: any = {};

    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.prisma.restaurant.findFirst({
        where: { ownerId: user.id },
      });
      if (!restaurant) return [];
      whereClause.restaurantId = restaurant.id;
    }

    return this.prisma.food.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('search')
  async searchFoods(@Query('q') query: string) {
    if (!query) return [];

    return this.prisma.food.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { restaurant: { is: { name: { contains: query, mode: 'insensitive' } } } },
              { restaurant: { is: { address: { contains: query, mode: 'insensitive' } } } },
            ]
          },
          {
            OR: [
              { restaurantId: null },
              { restaurant: { is: { isActive: true } } },
            ]
          }
        ],
        isActive: true,
        status: 'APPROVED',
      },
      include: {
        restaurant: {
          select: { name: true, address: true, ownerId: true },
        },
      },
      take: 20,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async createFood(@GetUser() user: any, @Body() body: any) {
    const { name, price, description, image, tags, restaurantId, lat, lng } =
      body;

    // 1. Nếu là RESTAURANT, buộc phải lấy nhà hàng của họ
    let finalRestaurantId: number | null;

    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.prisma.restaurant.findFirst({
        where: { ownerId: user.id },
      });
      if (!restaurant)
        throw new ForbiddenException('Bạn chưa đăng ký nhà hàng.');
      finalRestaurantId = restaurant.id;
    } else {
      // Admin có thể chỉ định restaurantId hoặc để null (món hệ thống)
      finalRestaurantId = restaurantId ? parseInt(restaurantId) : null;
    }

    // 2. Lấy tọa độ mặc định từ nhà hàng nếu không cung cấp
    let finalLat = lat ? parseFloat(lat) : null;
    let finalLng = lng ? parseFloat(lng) : null;

    if (finalRestaurantId && (!finalLat || !finalLng)) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: finalRestaurantId },
      });
      if (restaurant) {
        finalLat = finalLat || restaurant.latitude;
        finalLng = finalLng || restaurant.longitude;
      }
    }

    const food = await this.prisma.food.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        image,
        tags: tags || [],
        restaurantId: finalRestaurantId,
        lat: finalLat,
        lng: finalLng,
        status:
          user.role === UserRole.ADMIN
            ? FoodStatus.APPROVED
            : FoodStatus.PENDING,
        isActive: true,
      },
    });

    this.aiService.updateFoodEmbedding(food.id);
    return food;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async updateFood(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const foodId = parseInt(id);

    // Authorization Check
    await this.authZ.checkFoodOwnership(user.id, user.role, foodId);

    const { price, ...rest } = body;
    const data: any = { ...rest };
    if (price) data.price = parseFloat(price);

    // Nếu người cập nhật là Thương gia, chuyển trạng thái về CHỜ DUYỆT
    if (user.role === UserRole.RESTAURANT) {
      data.status = FoodStatus.PENDING;
    }

    const updatedFood = await this.prisma.food.update({
      where: { id: foodId },
      data,
    });

    this.aiService.updateFoodEmbedding(updatedFood.id);
    return updatedFood;
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveFood(
    @Param('id') id: string,
    @Body('status') status: FoodStatus,
  ) {
    return this.prisma.food.update({
      where: { id: parseInt(id) },
      data: { status },
    });
  }
}
