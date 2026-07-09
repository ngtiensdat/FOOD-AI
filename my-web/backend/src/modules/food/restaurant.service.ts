// Mục đích: Service xử lý toàn bộ logic nghiệp vụ liên quan đến Restaurant (lấy nhà hàng gần đây, thức ăn của nhà hàng, follow/unfollow, analytics).
// Ý nghĩa: Tách biệt khỏi FoodService sau khi tái cấu trúc SOLID SRP, được inject vào RestaurantController và RestaurantPublicController.
// Các biến đặc biệt: ensureRestaurantOwnership (private guard), checkFollowListVisibility (private visibility check).
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { RestaurantRepository } from './restaurant.repository';
import { FoodRepository } from './food.repository';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { AiService } from '../ai/ai.service';
import {
  User,
  FoodStatus,
  Prisma,
  UserRole,
  StaffInvitationStatus,
  UserStatus,
  NotificationType,
} from '@prisma/client';
import { LIMITS, CACHE_TTL } from '../../common/constants/limits.constant';
import { MESSAGES } from '../../common/constants/messages.constant';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';
import { RestaurantNearbyQueryDto } from './dto/restaurant-nearby-query.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { CreateStaffReviewDto } from './dto/create-staff-review.dto';
import { StaffAction } from '../../common/constants/enums.constant';

/** Locale hỗ trợ format ngày giᤁ theo chuẩn tiếng Việt */
const VI_LOCALE = 'vi-VN' as const;

/** Cấu trúc cài đặt preference liên quan đến follow list của người dùng */
interface UserFollowPreferences {
  showFollowList?: boolean;
}

@Injectable()
export class RestaurantService {
  constructor(
    private repository: RestaurantRepository,
    private foodRepository: FoodRepository,
    private prisma: PrismaService,
    private cacheService: CacheService,
    private aiService: AiService,
  ) {}

  async getNearbyRestaurants(query: RestaurantNearbyQueryDto) {
    const { lat, lng, radius } = query;
    if (lat === undefined || lng === undefined) return [];
    return this.repository.findNearbyRestaurants(
      lat,
      lng,
      radius || LIMITS.DEFAULT_NEARBY_RADIUS,
    );
  }

  async getMyRestaurant(user: User) {
    return this.ensureRestaurantOwnership(user.id);
  }

  async getMyBranches(user: User) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    if (!branches || branches.length === 0) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_OWNER);
    }
    return branches;
  }

  async updateMyRestaurantStatus(user: User, isActive: boolean) {
    const restaurant = await this.ensureRestaurantOwnership(user.id);
    const result = await this.repository.updateRestaurantStatus(
      restaurant.id,
      isActive,
    );
    await this.cacheService.invalidatePattern(
      `restaurants:public:${restaurant.id}`,
    );
    await this.cacheService.invalidatePattern('foods:*');
    return result;
  }

  async updateMyRestaurantProfile(user: User, dto: UpdateRestaurantProfileDto) {
    const restaurant = await this.ensureRestaurantOwnership(user.id);
    const result = await this.repository.updateRestaurantProfileTransaction(
      restaurant.id,
      user.id,
      dto,
    );
    await this.cacheService.invalidatePattern(
      `restaurants:public:${restaurant.id}`,
    );
    await this.cacheService.invalidatePattern('foods:*');
    return result;
  }

  async getPublicRestaurant(id: number, requestingUser?: User) {
    const cachedData = await this.cacheService.wrap(
      `restaurants:public:${id}`,
      async () => {
        const restaurant = await this.repository.findPublicRestaurantById(id);
        if (!restaurant) {
          return null;
        }

        const followingCount = await this.repository.countMerchantFollowing(
          restaurant.ownerId,
        );

        const prefs = (await this.repository.getUserPreferences(
          restaurant.ownerId,
        )) as UserFollowPreferences;
        const showFollowList = prefs.showFollowList !== false; // mặc định là true

        return {
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            description: restaurant.description,
            mapUrl: restaurant.mapUrl,
            isActive: restaurant.isActive,
            ownerId: restaurant.ownerId,
            createdAt: restaurant.createdAt,
            ratingAvg: restaurant.ratingAvg,
            ratingCount: restaurant.ratingCount,
            cuisines: restaurant.cuisines,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            profile: restaurant.profile,
            owner: restaurant.owner,
            foods: restaurant.foods.slice(0, LIMITS.RESTAURANT_INITIAL_FOODS),
          },
          stats: {
            followersCount: restaurant._count.followers,
            followingCount,
            showFollowList,
          },
        };
      },
      CACHE_TTL.RESTAURANT_PUBLIC,
    );

    if (!cachedData) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);
    }

    let isFollowing = false;
    if (requestingUser) {
      isFollowing = await this.repository.isUserFollowingRestaurant(
        requestingUser.id,
        id,
      );
    }

    return {
      ...cachedData,
      isFollowing,
    };
  }

  async getPublicRestaurantFoods(
    restaurantId: number,
    categoryId?: number,
    page: number = 1,
    pageSize: number = 8,
  ) {
    const where: Prisma.FoodWhereInput = {
      restaurantId,
      isActive: true,
      status: FoodStatus.APPROVED,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const { data, total } =
      await this.foodRepository.findManyFoodsWithPagination(
        where,
        (page - 1) * pageSize,
        pageSize,
      );

    return {
      items: data,
      total,
      page,
      pageSize,
    };
  }

  private async checkFollowListVisibility(
    restaurantId: number,
    requestingUser?: User,
  ) {
    const restaurant = await this.repository.findRestaurantById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);
    }

    const prefs = (await this.repository.getUserPreferences(
      restaurant.ownerId,
    )) as { showFollowList?: boolean };
    const showFollowList = prefs.showFollowList !== false; // mặc định là true

    if (!showFollowList && requestingUser?.id !== restaurant.ownerId) {
      throw new ForbiddenException(MESSAGES.RESTAURANT.PRIVATE_FOLLOW_LIST);
    }

    return restaurant;
  }

  async getRestaurantFollowers(id: number, requestingUser?: User) {
    await this.checkFollowListVisibility(id, requestingUser);
    return this.repository.findRestaurantFollowers(id);
  }

  async getMerchantFollowing(id: number, requestingUser?: User) {
    const restaurant = await this.checkFollowListVisibility(id, requestingUser);
    return this.repository.findMerchantFollowing(restaurant.ownerId);
  }

  async toggleFollowRestaurant(userId: number, restaurantId: number) {
    const restaurant = await this.repository.findRestaurantById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_FOUND);
    }

    const isFollowing = await this.repository.isUserFollowingRestaurant(
      userId,
      restaurantId,
    );
    if (isFollowing) {
      await this.repository.unfollowRestaurant(userId, restaurantId);
      return { followed: false };
    } else {
      await this.repository.followRestaurant(userId, restaurantId);
      return { followed: true };
    }
  }

  async getPublicRestaurants(filters: {
    search?: string;
    city?: string;
    district?: string;
    tag?: string;
    page?: number;
    pageSize?: number;
  }) {
    let restaurantIdsFromAi: number[] | undefined = undefined;

    const queryTerm = filters.tag || filters.search;
    if (queryTerm) {
      try {
        const semanticFoods = await this.aiService.semanticSearch(
          queryTerm,
          50,
        );
        if (semanticFoods && semanticFoods.length > 0) {
          const ids = semanticFoods
            .map((f) => f.restaurantId)
            .filter((id): id is number => id !== null && id !== undefined);
          if (ids.length > 0) {
            restaurantIdsFromAi = Array.from(new Set(ids));
          }
        }
      } catch (err) {
        console.error(
          'Lỗi khi thực hiện tìm kiếm ngữ nghĩa tại RestaurantService:',
          err,
        );
      }
    }

    return this.repository.findManyPublicRestaurants({
      ...filters,
      restaurantIdsFromAi,
    });
  }

  async getMyAnalytics(user: User) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId: user.id },
    });
    if (!restaurant) return [];

    const foods = await this.prisma.food.findMany({
      where: { restaurantId: restaurant.id, deletedAt: null },
      select: { id: true, name: true },
    });

    if (foods.length === 0) return [];

    const foodIds = foods.map((f) => f.id);

    const [viewCounts, aiCounts] = await Promise.all([
      this.prisma.history.groupBy({
        by: ['foodId'],
        where: { foodId: { in: foodIds } },
        _count: { foodId: true },
      }),
      this.prisma.aiFeedback.groupBy({
        by: ['foodId'],
        where: { foodId: { in: foodIds } },
        _count: { foodId: true },
      }),
    ]);

    const viewMap = new Map(viewCounts.map((v) => [v.foodId, v._count.foodId]));
    const aiMap = new Map(aiCounts.map((a) => [a.foodId, a._count.foodId]));

    return foods.map((food) => ({
      id: food.id,
      name: food.name,
      views: viewMap.get(food.id) ?? 0,
      aiSuggestions: aiMap.get(food.id) ?? 0,
    }));
  }

  async getMyStaffs(user: User) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);
    const staffs = await this.prisma.user.findMany({
      where: {
        role: UserRole.STAFF,
        restaurantId: { in: branchIds },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return staffs.map((staff) => ({
      id: staff.id.toString(),
      name: staff.name,
      email: staff.email,
      restaurantId: staff.restaurantId,
      role: staff.role,
      status: staff.status === UserStatus.APPROVED ? 'ACTIVE' : 'INACTIVE',
      createdAt: staff.createdAt.toLocaleDateString(VI_LOCALE),
    }));
  }

  async inviteMyStaff(user: User, dto: InviteStaffDto) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);
    if (!branchIds.includes(dto.restaurantId)) {
      throw new ForbiddenException('Bạn không sở hữu chi nhánh này.');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (!targetUser) {
      throw new NotFoundException(
        'Người dùng với email này chưa đăng ký tài khoản trên hệ thống.',
      );
    }

    if (
      targetUser.role === UserRole.STAFF ||
      targetUser.role === UserRole.RESTAURANT ||
      targetUser.role === UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Người dùng này đã có vai trò đặc biệt và không thể làm nhân viên.',
      );
    }

    const existingInv = await this.prisma.staffInvitation.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        restaurantId: dto.restaurantId,
        status: StaffInvitationStatus.PENDING,
      },
    });
    if (existingInv) {
      throw new ConflictException(
        'Đã gửi lời mời tới nhân viên này trước đó và đang chờ xác nhận.',
      );
    }

    const invitation = await this.prisma.staffInvitation.upsert({
      where: {
        email_restaurantId: {
          email: dto.email.toLowerCase(),
          restaurantId: dto.restaurantId,
        },
      },
      create: {
        email: dto.email.toLowerCase(),
        restaurantId: dto.restaurantId,
        status: StaffInvitationStatus.PENDING,
      },
      update: {
        status: StaffInvitationStatus.PENDING,
      },
      include: { restaurant: true },
    });

    await this.prisma.staffHistory.create({
      data: {
        userId: targetUser.id,
        userName: targetUser.name || 'Người dùng',
        userEmail: targetUser.email,
        restaurantId: dto.restaurantId,
        action: StaffAction.INVITED,
        performedById: user.id,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: NotificationType.SYSTEM,
        title: 'Lời mời nhận việc',
        content: `Chi nhánh "${invitation.restaurant.name}" của nhà hàng đã mời bạn làm nhân viên. Vui lòng vào mục Cài đặt -> Lời mời làm việc để phản hồi.`,
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      restaurantId: invitation.restaurantId,
      restaurantName: invitation.restaurant.name,
      status: invitation.status,
      createdAt: invitation.createdAt.toLocaleDateString(VI_LOCALE),
    };
  }

  async revokeInvitation(user: User, invitationId: string) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);

    const invitation = await this.prisma.staffInvitation.findFirst({
      where: { id: invitationId, restaurantId: { in: branchIds } },
      include: { restaurant: true },
    });
    if (!invitation) {
      throw new NotFoundException('Không tìm thấy lời mời.');
    }

    if (invitation.status !== StaffInvitationStatus.PENDING) {
      throw new ForbiddenException(
        'Chỉ có thể hủy lời mời đang ở trạng thái chờ.',
      );
    }

    await this.prisma.staffInvitation.update({
      where: { id: invitationId },
      data: { status: StaffInvitationStatus.REVOKED },
    });

    const targetUser = await this.prisma.user.findFirst({
      where: { email: invitation.email, deletedAt: null },
    });
    if (targetUser) {
      await this.prisma.staffHistory.create({
        data: {
          userId: targetUser.id,
          userName: targetUser.name || 'Người dùng',
          userEmail: targetUser.email,
          restaurantId: invitation.restaurantId,
          action: StaffAction.REVOKED,
          performedById: user.id,
        },
      });

      await this.prisma.notification.create({
        data: {
          userId: targetUser.id,
          type: NotificationType.SYSTEM,
          title: 'Hủy lời mời nhận việc',
          content: `Chi nhánh "${invitation.restaurant.name}" đã hủy lời mời làm nhân viên trước đó.`,
        },
      });
    }

    return { success: true };
  }

  async updateMyStaff(user: User, staffId: number, dto: UpdateStaffDto) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);

    const staff = await this.prisma.user.findFirst({
      where: {
        id: staffId,
        role: UserRole.STAFF,
        restaurantId: { in: branchIds },
        deletedAt: null,
      },
    });
    if (!staff) {
      throw new NotFoundException('Không tìm thấy nhân viên này.');
    }

    if (dto.restaurantId && !branchIds.includes(dto.restaurantId)) {
      throw new ForbiddenException('Bạn không sở hữu chi nhánh mới này.');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.name) {
      updateData.name = dto.name;
      await this.prisma.userProfile.upsert({
        where: { userId: staffId },
        create: { userId: staffId, fullName: dto.name },
        update: { fullName: dto.name },
      });
    }
    if (dto.restaurantId) {
      updateData.restaurant = { connect: { id: dto.restaurantId } };
    }
    if (dto.status) {
      updateData.status =
        dto.status === 'ACTIVE' ? UserStatus.APPROVED : UserStatus.REJECTED;
    }

    const updated = await this.prisma.user.update({
      where: { id: staffId },
      data: updateData,
    });

    return {
      id: updated.id.toString(),
      name: updated.name,
      email: updated.email,
      restaurantId: updated.restaurantId,
      role: updated.role,
      status: updated.status === UserStatus.APPROVED ? 'ACTIVE' : 'INACTIVE',
      createdAt: updated.createdAt.toLocaleDateString(VI_LOCALE),
    };
  }

  async removeStaffMember(user: User, staffId: number) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);

    const staff = await this.prisma.user.findFirst({
      where: {
        id: staffId,
        role: UserRole.STAFF,
        restaurantId: { in: branchIds },
        deletedAt: null,
      },
    });
    if (!staff) {
      throw new NotFoundException('Không tìm thấy nhân viên này.');
    }

    const oldRestaurantId = staff.restaurantId;

    await this.prisma.user.update({
      where: { id: staffId },
      data: {
        role: UserRole.CUSTOMER,
        restaurantId: null,
      },
    });

    if (oldRestaurantId) {
      await this.prisma.staffHistory.create({
        data: {
          userId: staffId,
          userName: staff.name || 'Người dùng',
          userEmail: staff.email,
          restaurantId: oldRestaurantId,
          action: StaffAction.REMOVED,
          performedById: user.id,
        },
      });
    }

    return { success: true };
  }

  async getStaffInvitations(user: User) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);
    const invitations = await this.prisma.staffInvitation.findMany({
      where: { restaurantId: { in: branchIds } },
      orderBy: { createdAt: 'desc' },
      include: { restaurant: true },
    });
    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      restaurantId: inv.restaurantId,
      restaurantName: inv.restaurant.name,
      status: inv.status,
      createdAt: inv.createdAt.toLocaleDateString(VI_LOCALE),
    }));
  }

  async getStaffHistories(user: User) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);

    const histories = await this.prisma.staffHistory.findMany({
      where: { restaurantId: { in: branchIds } },
      orderBy: { createdAt: 'desc' },
      include: { restaurant: true, user: true, performedBy: true },
    });

    return histories.map((h) => ({
      id: h.id,
      userId: h.userId,
      userName: h.userName,
      userEmail: h.userEmail,
      restaurantId: h.restaurantId,
      restaurantName: h.restaurant.name,
      action: h.action,
      performedBy: h.performedBy ? h.performedBy.name : 'Hệ thống',
      createdAt: h.createdAt.toLocaleString(VI_LOCALE),
    }));
  }

  async getStaffReviews(user: User) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);

    const reviews = await this.prisma.staffReview.findMany({
      where: { restaurantId: { in: branchIds } },
      orderBy: { createdAt: 'desc' },
      include: { restaurant: true, user: true },
    });

    return reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name || 'Nhân viên',
      userEmail: r.user.email,
      restaurantName: r.restaurant.name,
      rating: r.rating,
      feedback: r.feedback,
      createdAt: r.createdAt.toLocaleDateString(VI_LOCALE),
    }));
  }

  async createStaffReview(
    user: User,
    staffId: number,
    dto: CreateStaffReviewDto,
  ) {
    const branches = await this.repository.findManyRestaurantsByOwnerId(
      user.id,
    );
    const branchIds = branches.map((b) => b.id);

    const staff = await this.prisma.user.findFirst({
      where: {
        id: staffId,
        role: UserRole.STAFF,
        restaurantId: { in: branchIds },
        deletedAt: null,
      },
    });
    if (!staff) {
      throw new NotFoundException('Không tìm thấy nhân viên này.');
    }

    const review = await this.prisma.staffReview.create({
      data: {
        userId: staffId,
        restaurantId: staff.restaurantId!,
        reviewerId: user.id,
        rating: dto.rating,
        feedback: dto.feedback,
      },
    });

    return review;
  }

  async getUserJobInvitations(user: User) {
    const invitations = await this.prisma.staffInvitation.findMany({
      where: {
        email: user.email.toLowerCase(),
        status: StaffInvitationStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      include: { restaurant: true },
    });
    return invitations.map((inv) => ({
      id: inv.id,
      restaurantName: inv.restaurant.name,
      restaurantAddress: inv.restaurant.address,
      restaurantId: inv.restaurantId,
      createdAt: inv.createdAt.toLocaleDateString(VI_LOCALE),
    }));
  }

  async respondToJobInvitation(
    user: User,
    invitationId: string,
    accept: boolean,
  ) {
    const invitation = await this.prisma.staffInvitation.findFirst({
      where: { id: invitationId, email: user.email.toLowerCase() },
      include: { restaurant: true },
    });
    if (!invitation) {
      throw new NotFoundException('Không tìm thấy lời mời nhận việc.');
    }
    if (invitation.status !== StaffInvitationStatus.PENDING) {
      throw new ForbiddenException(
        'Lời mời này đã được phản hồi hoặc đã bị thu hồi.',
      );
    }

    if (accept) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: UserRole.STAFF,
          restaurantId: invitation.restaurantId,
        },
      });

      await this.prisma.staffInvitation.update({
        where: { id: invitationId },
        data: { status: StaffInvitationStatus.ACCEPTED },
      });

      await this.prisma.staffHistory.create({
        data: {
          userId: user.id,
          userName: user.name || 'Người dùng',
          userEmail: user.email,
          restaurantId: invitation.restaurantId,
          action: StaffAction.ACCEPTED,
          performedById: user.id,
        },
      });

      await this.prisma.notification.create({
        data: {
          userId: invitation.restaurant.ownerId,
          type: NotificationType.SYSTEM,
          title: 'Nhân viên đồng ý nhận việc',
          content: `Người dùng "${user.name || user.email}" đã đồng ý lời mời làm việc tại chi nhánh "${invitation.restaurant.name}".`,
        },
      });
    } else {
      await this.prisma.staffInvitation.update({
        where: { id: invitationId },
        data: { status: StaffInvitationStatus.DECLINED },
      });

      await this.prisma.staffHistory.create({
        data: {
          userId: user.id,
          userName: user.name || 'Người dùng',
          userEmail: user.email,
          restaurantId: invitation.restaurantId,
          action: StaffAction.DECLINED,
          performedById: user.id,
        },
      });

      await this.prisma.notification.create({
        data: {
          userId: invitation.restaurant.ownerId,
          type: NotificationType.SYSTEM,
          title: 'Nhân viên từ chối lời mời',
          content: `Người dùng "${user.name || user.email}" đã từ chối lời mời làm việc tại chi nhánh "${invitation.restaurant.name}".`,
        },
      });
    }

    return { success: true };
  }

  private async ensureRestaurantOwnership(userId: number) {
    const restaurant = await this.repository.findRestaurantByOwnerId(userId);
    if (!restaurant) {
      throw new NotFoundException(MESSAGES.RESTAURANT.NOT_OWNER);
    }
    return restaurant;
  }
}
