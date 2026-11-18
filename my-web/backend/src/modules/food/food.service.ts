/**
 * Mục đích file này: Định nghĩa service thực hiện logic nghiệp vụ cho đối tượng Món ăn (Food).
 * Các file khác hay file này có ý nghĩa như nào: Phối hợp giữa FoodRepository và VectorSyncService để lưu trữ, cập nhật thông tin món ăn và đồng bộ vector embedding cho AI.
 * Các chức năng đặc biệt: createFood, updateFood, deleteFood, tìm kiếm món ăn kết hợp phân trang và lọc theo danh mục.
 */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FoodRepository } from './food.repository';
import { RestaurantRepository } from './restaurant.repository';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { AiLearningService } from '../ai/services/ai-learning.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { FoodQueryDto } from './dto/food-query.dto';
import {
  UserRole,
  FoodStatus,
  Prisma,
  User,
  FeedbackType,
} from '@prisma/client';
import { LIMITS } from '../../common/constants/limits.constant';
import { MESSAGES } from '../../common/constants/messages.constant';
import { BulkCreateFoodDto } from './dto/bulk-create-food.dto';
import { MediaService } from '../media/media.service';
import { extractPublicId } from '../../common/utils/cloudinary.helper';
import { FoodModerationService } from '../ai/services/food-moderation.service';
import { buildFoodFilterConditions } from './food-category.constant';

const FOOD_DISPLAY_LIMIT = 50;

@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);
  constructor(
    private repository: FoodRepository,
    private restaurantRepository: RestaurantRepository,
    private aiService: AiService,
    private prisma: PrismaService,
    private aiLearningService: AiLearningService,
    private cacheService: CacheService,
    private mediaService: MediaService,
    private foodModerationService: FoodModerationService,
  ) {}

  async getAllFoods(query: FoodQueryDto) {
    const cacheKey = `foods:list:${JSON.stringify(query)}`;
    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const { tag, search, city, district, limit } = query;
        const where: Prisma.FoodWhereInput = {
          isActive: true,
          status: FoodStatus.APPROVED,
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        };

        const andFilters: Prisma.FoodWhereInput[] = [];

        if (city) {
          andFilters.push({
            OR: [
              { address: { contains: city, mode: 'insensitive' } },
              {
                restaurant: {
                  is: { address: { contains: city, mode: 'insensitive' } },
                },
              },
            ],
          });
        }

        if (district) {
          andFilters.push({
            OR: [
              { address: { contains: district, mode: 'insensitive' } },
              {
                restaurant: {
                  is: { address: { contains: district, mode: 'insensitive' } },
                },
              },
            ],
          });
        }

        if (tag) {
          andFilters.push({ OR: buildFoodFilterConditions(tag, true) });
        }

        if (search) {
          andFilters.push({ OR: buildFoodFilterConditions(search, false) });
        }

        if (query.hasImage || query.curated) {
          andFilters.push({
            image: { not: null },
            NOT: [{ image: '' }, { image: { contains: 'placeholder' } }],
          });
        }

        if (query.curated) {
          andFilters.push({
            NOT: [
              { name: { contains: 'Topping', mode: 'insensitive' } },
              { name: { contains: 'Rau sống', mode: 'insensitive' } },
              { name: { contains: 'Thêm', mode: 'insensitive' } },
              { name: { contains: 'Bổ sung', mode: 'insensitive' } },
              { name: { contains: 'Gia vị', mode: 'insensitive' } },
              { name: { contains: 'Nước chấm', mode: 'insensitive' } },
              { name: { contains: 'Nước lẩu', mode: 'insensitive' } },
              { name: { contains: 'Nước sốt', mode: 'insensitive' } },
              { name: { startsWith: 'Pate nóng', mode: 'insensitive' } },
              { name: { equals: 'Quẩy', mode: 'insensitive' } },
            ],
          });
        }

        if (query.diet === 'chay' || query.diet === 'vegetarian') {
          andFilters.push({
            OR: [
              { tags: { has: 'chay' } },
              { name: { contains: 'Chay', mode: 'insensitive' } },
              { name: { contains: 'Nấm', mode: 'insensitive' } },
              { name: { contains: 'Salad', mode: 'insensitive' } },
              { name: { contains: 'Đậu phụ', mode: 'insensitive' } },
              { description: { contains: 'chay', mode: 'insensitive' } },
            ],
          });
        }

        if (query.spice === 'cay' || query.spice === 'spicy') {
          andFilters.push({
            OR: [
              { tags: { has: 'cay' } },
              { name: { contains: 'Cay', mode: 'insensitive' } },
              { name: { contains: 'Sa tế', mode: 'insensitive' } },
              { name: { contains: 'Lẩu thái', mode: 'insensitive' } },
              { name: { contains: 'Chili', mode: 'insensitive' } },
              { description: { contains: 'cay', mode: 'insensitive' } },
            ],
          });
        }

        if (query.cuisine) {
          const CUISINE_EXPANSION_MAP: Record<string, string[]> = {
            western: [
              'pizza',
              'burger',
              'steak',
              'mì ý',
              'spaghetti',
              'pasta',
              'âu mỹ',
              'beefsteak',
            ],
            'âu mỹ': [
              'pizza',
              'burger',
              'steak',
              'mì ý',
              'spaghetti',
              'pasta',
              'âu mỹ',
              'beefsteak',
            ],
            korean: [
              'kimbap',
              'tokbokki',
              'mì cay',
              'kim chi',
              'hàn quốc',
              'korea',
              'nướng hàn',
            ],
            'hàn quốc': [
              'kimbap',
              'tokbokki',
              'mì cay',
              'kim chi',
              'hàn quốc',
              'korea',
              'nướng hàn',
            ],
            japanese: [
              'sushi',
              'sashimi',
              'ramen',
              'udon',
              'nhật bản',
              'japan',
              'tempura',
              'bento',
            ],
            'nhật bản': [
              'sushi',
              'sashimi',
              'ramen',
              'udon',
              'nhật bản',
              'japan',
              'tempura',
              'bento',
            ],
            vietnamese: [
              'phở',
              'bún',
              'cơm tấm',
              'bánh mì',
              'nem',
              'xôi',
              'việt nam',
              'món việt',
            ],
            'món việt': [
              'phở',
              'bún',
              'cơm tấm',
              'bánh mì',
              'nem',
              'xôi',
              'việt nam',
              'món việt',
            ],
            'đồ cay': ['cay', 'sa tế', 'chili', 'lẩu thái', 'mì cay'],
            'ăn chay': ['chay', 'nấm', 'đậu phụ', 'salad', 'thanh đạm'],
            'cơm văn phòng': [
              'cơm',
              'cơm tấm',
              'cơm sườn',
              'cơm gà',
              'cơm thố',
            ],
            'đồ nướng': [
              'nướng',
              'bbq',
              'sườn',
              'ba chỉ',
              'thịt nướng',
              'bò nướng',
            ],
            bbq: ['nướng', 'bbq', 'sườn', 'ba chỉ', 'thịt nướng', 'bò nướng'],
            'trà sữa': ['trà sữa', 'trà đào', 'trà tắc', 'trân châu'],
            'đồ ăn vặt': [
              'ăn vặt',
              'bánh tráng',
              'nem chua',
              'khoai lắc',
              'gà rán',
              'tokbokki',
            ],
          };

          const rawKeywords = query.cuisine
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

          const expandedKeywords = new Set<string>();
          for (const rawKw of rawKeywords) {
            expandedKeywords.add(rawKw);
            for (const [mapKey, expansions] of Object.entries(
              CUISINE_EXPANSION_MAP,
            )) {
              if (rawKw.includes(mapKey) || mapKey.includes(rawKw)) {
                expansions.forEach((e) => expandedKeywords.add(e));
              }
            }
          }

          if (expandedKeywords.size > 0) {
            const orConditions: Prisma.FoodWhereInput[] = [];
            for (const kw of Array.from(expandedKeywords)) {
              orConditions.push(
                { name: { contains: kw, mode: 'insensitive' } },
                { description: { contains: kw, mode: 'insensitive' } },
                { tags: { has: kw } },
              );
            }
            if (orConditions.length > 0) {
              andFilters.push({ OR: orConditions });
            }
          }
        }

        if (query.allergies) {
          const allergyList = query.allergies
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          for (const allergy of allergyList) {
            if (allergy.includes('seafood') || allergy.includes('hải sản')) {
              andFilters.push({
                NOT: [
                  { name: { contains: 'tôm', mode: 'insensitive' } },
                  { name: { contains: 'cua', mode: 'insensitive' } },
                  { name: { contains: 'ghẹ', mode: 'insensitive' } },
                  { name: { contains: 'hải sản', mode: 'insensitive' } },
                  { name: { contains: 'mực', mode: 'insensitive' } },
                  { name: { contains: 'ốc', mode: 'insensitive' } },
                  { tags: { has: 'hải sản' } },
                ],
              });
            }
            if (
              allergy.includes('peanut') ||
              allergy.includes('lạc') ||
              allergy.includes('đậu phộng')
            ) {
              andFilters.push({
                NOT: [
                  { name: { contains: 'lạc', mode: 'insensitive' } },
                  { name: { contains: 'đậu phộng', mode: 'insensitive' } },
                  {
                    description: {
                      contains: 'đậu phộng',
                      mode: 'insensitive',
                    },
                  },
                ],
              });
            }
          }
        }

        if (andFilters.length > 0) {
          where.AND = andFilters;
        }

        const displayLimit = limit
          ? Math.min(Math.max(limit, 1), 100)
          : FOOD_DISPLAY_LIMIT;

        const orderBy: Prisma.FoodOrderByWithRelationInput[] = query.curated
          ? [
              { isAdminRecommended: 'desc' },
              { isFeaturedToday: 'desc' },
              { totalLike: 'desc' },
              { createdAt: 'desc' },
            ]
          : [{ createdAt: 'desc' }];

        const result = await this.repository.findAll(
          where,
          1,
          displayLimit,
          orderBy,
        );
        const foods = result.data;

        if (search || tag) {
          const queryTerm = (search || tag || '').trim().toLowerCase();
          foods.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase().includes(queryTerm)
              ? 100
              : 0;
            const bNameMatch = b.name.toLowerCase().includes(queryTerm)
              ? 100
              : 0;
            if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;

            const aTagMatch = (a.tags || []).some((t) =>
              t.toLowerCase().includes(queryTerm),
            )
              ? 50
              : 0;
            const bTagMatch = (b.tags || []).some((t) =>
              t.toLowerCase().includes(queryTerm),
            )
              ? 50
              : 0;
            if (aTagMatch !== bTagMatch) return bTagMatch - aTagMatch;

            return 0;
          });
        }

        return {
          data: foods,
          meta: {
            total: result.total,
            limit: displayLimit,
          },
        };
      },
      300, // 5 minutes TTL
    );
  }

  async trackView(user: User, id: number) {
    if (!user) return;
    return this.repository.trackView(user.id, id);
  }

  async toggleFavorite(userId: number, foodId: number) {
    const isFavorite = await this.repository.toggleFavorite(userId, foodId);

    let conversation = await this.prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          metadata: {
            title: 'Hội thoại mới',
            slots: {},
            current_stage: 'COLLECTING',
            rejected_food_ids: [],
            suggested_food_ids: [],
          },
        },
      });
    }

    const existingFeedback = await this.prisma.aiFeedback.findFirst({
      where: {
        userId,
        foodId,
      },
    });

    if (isFavorite) {
      if (existingFeedback) {
        await this.prisma.aiFeedback.update({
          where: { id: existingFeedback.id },
          data: {
            feedbackType: FeedbackType.LIKE,
            createdAt: new Date(),
          },
        });
      } else {
        await this.prisma.aiFeedback.create({
          data: {
            userId,
            conversationId: conversation.id,
            foodId,
            feedbackType: FeedbackType.LIKE,
          },
        });
      }
    } else {
      if (
        existingFeedback &&
        existingFeedback.feedbackType === FeedbackType.LIKE
      ) {
        await this.prisma.aiFeedback.delete({
          where: {
            id: existingFeedback.id,
          },
        });
      }
    }

    this.aiLearningService
      .updateUserEmbeddingWithFeedback(userId)
      .catch((err: unknown) => {
        // Gracefully handle embedding calculation failure in background
      });

    return { isFavorite };
  }

  async getRecentFoods(
    user: User,
    limit: number = LIMITS.DEFAULT_RECENT_VIEWS,
  ) {
    if (!user) return [];
    return this.repository.findRecentViews(user.id, limit);
  }

  async getNearbyFoods(query: FoodQueryDto) {
    const { lat, lng, radius, city, district } = query;
    if (lat === undefined || lng === undefined) return [];
    let foods = await this.repository.findNearby(
      lat,
      lng,
      radius || LIMITS.DEFAULT_NEARBY_RADIUS,
    );

    if (city) {
      const cityLower = city.toLowerCase();
      foods = foods.filter(
        (f) =>
          (f.address && f.address.toLowerCase().includes(cityLower)) ||
          (f.restaurant?.address &&
            f.restaurant.address.toLowerCase().includes(cityLower)),
      );
    }

    if (district) {
      const districtLower = district.toLowerCase();
      foods = foods.filter(
        (f) =>
          (f.address && f.address.toLowerCase().includes(districtLower)) ||
          (f.restaurant?.address &&
            f.restaurant.address.toLowerCase().includes(districtLower)),
      );
    }

    return foods;
  }

  async createFood(user: User, dto: CreateFoodDto) {
    const restaurant = await this.restaurantRepository.findRestaurantById(
      dto.restaurantId,
    );
    if (!restaurant) throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException(MESSAGES.FOOD.NO_POST_PERMISSION);
    }

    let lat = dto.lat;
    let lng = dto.lng;
    let address = dto.address;
    let mapUrl = dto.mapUrl;

    if (!lat || !lng || !address || !mapUrl) {
      lat = lat || restaurant.latitude;
      lng = lng || restaurant.longitude;
      address = address || restaurant.address;
      mapUrl = mapUrl || restaurant.mapUrl || undefined;
    }

    let initialStatus: FoodStatus = FoodStatus.APPROVED;
    if (user.role === UserRole.RESTAURANT) {
      const moderation = await this.foodModerationService.moderateFood({
        name: dto.name,
        description: dto.description,
        tags: dto.tags,
        price: dto.price,
        image: dto.image,
      });

      if (moderation.isApproved) {
        initialStatus = FoodStatus.APPROVED;
        this.logger.log(
          `[AI Moderation APPROVED] Món mới "${dto.name}" được AI phê duyệt tự động. Lý do: ${moderation.reason}`,
        );
      } else {
        initialStatus = FoodStatus.PENDING;
        this.logger.warn(
          `[AI Moderation PENDING] Món mới "${dto.name}" cần Admin duyệt thủ công. Lý do: ${moderation.reason}`,
        );
      }
    }

    const food = await this.repository.create({
      name: dto.name,
      price: dto.price,
      description: dto.description,
      image: dto.image,
      tags: dto.tags || [],
      lat,
      lng,
      address,
      mapUrl,
      calories: dto.calories ?? 0,
      carbs: dto.carbs ?? 0,
      protein: dto.protein ?? 0,
      fat: dto.fat ?? 0,
      categoryId: dto.categoryId || null,
      restaurantId: dto.restaurantId,
      status: initialStatus,
      isActive: true,
    });

    void this.aiService.updateFoodEmbedding(food.id);
    await this.cacheService.invalidatePattern('foods:*');
    return food;
  }

  async createBulk(user: User, dto: BulkCreateFoodDto) {
    const restaurant = await this.restaurantRepository.findRestaurantById(
      dto.restaurantId,
    );
    if (!restaurant) throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException(MESSAGES.FOOD.NO_EDIT_PERMISSION);
    }

    const defaultLat = restaurant.latitude;
    const defaultLng = restaurant.longitude;
    const defaultAddress = restaurant.address;
    const defaultMapUrl = restaurant.mapUrl || null;
    const defaultStatus =
      user.role === UserRole.ADMIN ? FoodStatus.APPROVED : FoodStatus.PENDING;

    const dataToInsert = dto.foods.map((foodDto) => ({
      name: foodDto.name,
      price: foodDto.price,
      description: foodDto.description || null,
      image: foodDto.image || null,
      tags: foodDto.tags || [],
      lat: foodDto.lat ?? defaultLat,
      lng: foodDto.lng ?? defaultLng,
      address: foodDto.address ?? defaultAddress,
      mapUrl: foodDto.mapUrl ?? defaultMapUrl,
      calories: foodDto.calories ?? 0,
      carbs: foodDto.carbs ?? 0,
      protein: foodDto.protein ?? 0,
      fat: foodDto.fat ?? 0,
      restaurantId: dto.restaurantId,
      categoryId: foodDto.categoryId || null,
      status: defaultStatus,
      isActive: true,
    }));

    const result = await this.repository.createMany(dataToInsert);
    await this.cacheService.invalidatePattern('foods:*');
    return { count: result.count };
  }

  async updateFood(user: User, id: number, dto: UpdateFoodDto) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException(MESSAGES.FOOD.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT) {
      if (food.restaurant?.ownerId !== user.id) {
        throw new ForbiddenException(MESSAGES.FOOD.NO_EDIT_PERMISSION);
      }
    }

    const keysToCheck = Object.keys(dto) as Array<keyof UpdateFoodDto>;
    const hasChanges = keysToCheck.some((key) => {
      const dtoValue = dto[key];
      const dbValue = food[key];

      if (dtoValue === undefined) return false;

      if (Array.isArray(dtoValue) && Array.isArray(dbValue)) {
        return (
          dtoValue.length !== dbValue.length ||
          !dtoValue.every((val, idx) => val === dbValue[idx])
        );
      }

      const normalizedDto =
        dtoValue === null || dtoValue === undefined ? '' : dtoValue;
      const normalizedDb =
        dbValue === null || dbValue === undefined ? '' : dbValue;

      if (
        typeof normalizedDto === 'number' ||
        typeof normalizedDb === 'number'
      ) {
        return Number(normalizedDto) !== Number(normalizedDb);
      }

      return normalizedDto !== normalizedDb;
    });

    const data: Prisma.FoodUpdateInput = { ...dto };
    if (user.role === UserRole.RESTAURANT && hasChanges) {
      const moderation = await this.foodModerationService.moderateFood({
        name: dto.name ?? food.name,
        description:
          dto.description !== undefined ? dto.description : food.description,
        tags: dto.tags ?? food.tags,
        price: dto.price ?? food.price,
        image: dto.image ?? food.image,
      });

      if (moderation.isApproved) {
        data.status = FoodStatus.APPROVED;
        this.logger.log(
          `[AI Moderation APPROVED] Cập nhật món "${dto.name || food.name}" được AI phê duyệt tự động. Lý do: ${moderation.reason}`,
        );
      } else {
        data.status = FoodStatus.PENDING;
        this.logger.warn(
          `[AI Moderation PENDING] Cập nhật món "${dto.name || food.name}" cần Admin duyệt thủ công. Lý do: ${moderation.reason}`,
        );
      }
    }

    const updatedFood = await this.repository.update(id, data);

    // Dọn dẹp ảnh cũ trên Cloudinary nếu người dùng thay ảnh mới
    if (dto.image && food.image && dto.image !== food.image) {
      const publicId = extractPublicId(food.image);
      if (publicId) {
        this.mediaService.deleteImage(publicId).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Lỗi xóa ảnh món ăn cũ: ${msg}`);
        });
      }
    }

    void this.aiService.updateFoodEmbedding(updatedFood.id);
    await this.cacheService.invalidatePattern('foods:*');
    return updatedFood;
  }

  async toggleRecommend(id: number) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException(MESSAGES.FOOD.NOT_FOUND);

    const updated = await this.repository.update(id, {
      isAdminRecommended: !food.isAdminRecommended,
    });
    await this.cacheService.invalidatePattern('foods:*');
    return updated;
  }

  async getFeaturedToday() {
    return this.cacheService.wrap(
      'foods:featured-today',
      async () => {
        const result = await this.repository.findAll({
          isFeaturedToday: true,
          isActive: true,
          status: FoodStatus.APPROVED,
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        });
        return result.data;
      },
      900, // 15 minutes TTL
    );
  }

  async getFeaturedWeekly() {
    return this.cacheService.wrap(
      'foods:featured-weekly',
      async () => {
        const result = await this.repository.findAll({
          isFeaturedWeekly: true,
          isActive: true,
          status: FoodStatus.APPROVED,
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        });
        return result.data;
      },
      900, // 15 minutes TTL
    );
  }

  async getRecommended() {
    return this.cacheService.wrap(
      'foods:recommended',
      async () => {
        const result = await this.repository.findAll({
          isAdminRecommended: true,
          isActive: true,
          status: FoodStatus.APPROVED,
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        });
        return result.data;
      },
      900, // 15 minutes TTL
    );
  }

  async search(query: string) {
    if (!query) return { data: [], meta: { total: 0 } };

    // 1. Thử nghiệm tìm kiếm ngữ nghĩa qua AI (Semantic Vector Search)
    try {
      const semanticResults = await this.aiService.semanticSearch(query, 20);
      if (semanticResults && semanticResults.length > 0) {
        const data = semanticResults.map((r) => ({
          id: r.id,
          name: r.name,
          price: r.price,
          description: r.description,
          image: r.image,
          tags: r.tags,
          isActive: true,
          status: FoodStatus.APPROVED,
          categoryId: null,
          restaurantId: null,
          restaurant: {
            name: r.restaurantName,
            address: r.address,
            isActive: true,
          },
        }));

        return {
          data,
          meta: {
            total: semanticResults.length,
          },
        };
      }
    } catch (err) {
      console.error(
        'Lỗi tìm kiếm ngữ nghĩa AI, chuyển sang tìm kiếm từ khóa thông thường:',
        err,
      );
    }

    // 2. Dự phòng (Fallback) - Tìm kiếm từ khóa nếu AI lỗi hoặc không có kết quả phù hợp
    const result = await this.repository.findAll({
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            {
              restaurant: {
                is: { name: { contains: query, mode: 'insensitive' } },
              },
            },
            {
              restaurant: {
                is: { address: { contains: query, mode: 'insensitive' } },
              },
            },
          ],
        },
        {
          OR: [
            { restaurantId: null },
            { restaurant: { is: { isActive: true } } },
          ],
        },
      ],
      isActive: true,
      status: FoodStatus.APPROVED,
    });
    return result;
  }

  async getMerchantFoods(user: User, page?: number, pageSize?: number) {
    const where: Prisma.FoodWhereInput = { deletedAt: null };
    if (user.role === UserRole.RESTAURANT) {
      const restaurant =
        await this.restaurantRepository.findRestaurantByOwnerId(user.id);
      if (!restaurant) {
        return page && pageSize
          ? { data: [], meta: { total: 0, page, pageSize } }
          : [];
      }
      where.restaurantId = restaurant.id;
    } else if (user.role === UserRole.STAFF) {
      if (!user.restaurantId) {
        return page && pageSize
          ? { data: [], meta: { total: 0, page, pageSize } }
          : [];
      }
      where.restaurantId = user.restaurantId;
    }

    if (page && pageSize) {
      const result = await this.repository.findAll(where, page, pageSize);
      return {
        data: result.data,
        meta: {
          total: result.total,
          page,
          pageSize,
        },
      };
    }

    const result = await this.repository.findAll(where);
    return result.data;
  }

  async deleteFood(user: User, id: number) {
    const food = await this.repository.findById(id);
    if (!food) throw new NotFoundException(MESSAGES.FOOD.NOT_FOUND);

    if (
      user.role === UserRole.RESTAURANT &&
      food.restaurant?.ownerId !== user.id
    ) {
      throw new ForbiddenException(MESSAGES.FOOD.NO_DELETE_PERMISSION);
    }

    const result = await this.repository.delete(id);

    // Xóa ảnh món ăn trên Cloudinary khi món bị xóa
    if (food.image) {
      const publicId = extractPublicId(food.image);
      if (publicId) {
        this.mediaService.deleteImage(publicId).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Lỗi xóa ảnh món ăn khi xóa món: ${msg}`);
        });
      }
    }

    await this.cacheService.invalidatePattern('foods:*');
    return result;
  }

  async approveFood(id: number, status: FoodStatus) {
    const result = await this.repository.update(id, {
      status,
      isAdminRecommended: false,
      isFeaturedToday: false,
      isFeaturedWeekly: false,
    });
    await this.cacheService.invalidatePattern('foods:*');
    return result;
  }
}
