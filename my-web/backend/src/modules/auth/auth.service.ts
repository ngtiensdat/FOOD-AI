import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { BcryptHelper } from '../../common/utils/bcrypt.helper';
import { MESSAGES } from '../../common/constants/messages.constant';
import { JwtService } from '@nestjs/jwt';
import {
  UserStatus,
  UserRole,
  User,
  UserProfile,
  Prisma,
} from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AiService } from '../ai/ai.service';
import { appConfig } from '../../config/app.config';
import { JwtPayload } from '../../common/types/jwt-payload';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private aiService: AiService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(MESSAGES.AUTH.USER_EXISTS);
    }

    const hashedPassword = await BcryptHelper.hash(dto.password, 10);
    const status =
      dto.role === UserRole.RESTAURANT
        ? UserStatus.PENDING
        : UserStatus.APPROVED;

    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role || UserRole.CUSTOMER,
      status,
      isEmailVerified: true,
      profile: {
        create: {
          fullName: dto.name,
        },
      },
      ...(dto.role === UserRole.RESTAURANT
        ? {
            legalDocuments: dto.legalDocuments,
          }
        : {}),
    });

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    console.log(`[AuthService] Attempting login for: ${dto.email}`);
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      console.warn(`[AuthService] User not found: ${dto.email}`);
      throw new NotFoundException(
        'Tài khoản này chưa được đăng ký trên hệ thống.',
      );
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException('Tài khoản đang chờ phê duyệt');
    }
    if (user.status === UserStatus.REJECTED) {
      throw new UnauthorizedException('Tài khoản đã bị từ chối');
    }

    const isPasswordValid = await BcryptHelper.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      console.warn(`[AuthService] Invalid password for: ${dto.email}`);
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    console.log(`[AuthService] Login successful: ${dto.email}`);
    return this.generateToken(user);
  }

  async getProfile(targetId: number, requesterId?: number) {
    const user = await this.userRepository.findById(targetId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    let isFollowing = false;
    if (requesterId) {
      const follow = await this.userRepository.findWithFollow(
        requesterId,
        targetId,
      );
      isFollowing = !!follow;
    }

    const {
      password: _password,
      refreshToken: _refreshToken,
      ...userWithoutSensitiveData
    } = user;
    return { ...userWithoutSensitiveData, isFollowing };
  }

  async completeOnboarding(userId: number, dto: CompleteOnboardingDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (user.role === UserRole.RESTAURANT) {
      const branches = dto.branches;
      if (!branches || branches.length === 0) {
        throw new BadRequestException(
          'Thương gia bắt buộc phải đăng ký ít nhất 1 cơ sở.',
        );
      }

      // Sử dụng Database Transaction để đảm bảo tính toàn vẹn dữ liệu
      await this.prisma.$transaction(async (tx) => {
        // Lấy danh sách các chi nhánh hiện có của user
        const existingRestaurants = await tx.restaurant.findMany({
          where: { ownerId: userId },
          orderBy: { id: 'asc' },
        });

        for (let i = 0; i < branches.length; i++) {
          const branch = branches[i];
          if (i < existingRestaurants.length) {
            // Cập nhật chi nhánh đã có (để không bị mất món ăn)
            await tx.restaurant.update({
              where: { id: existingRestaurants[i].id },
              data: {
                name: branch.name,
                address: branch.address,
                latitude: branch.latitude,
                longitude: branch.longitude,
                mapUrl: branch.mapUrl,
                profile: {
                  upsert: {
                    create: {
                      bio:
                        branch.bio ||
                        'Chào mừng bạn đến với nhà hàng của chúng tôi!',
                      openingHours: branch.openingHours || '00:00 - 00:00',
                    },
                    update: {
                      bio: branch.bio,
                      openingHours: branch.openingHours,
                    },
                  },
                },
              },
            });
          } else {
            // Thêm mới nếu danh sách truyền lên nhiều hơn số hiện có
            await tx.restaurant.create({
              data: {
                name: branch.name,
                address: branch.address,
                latitude: branch.latitude,
                longitude: branch.longitude,
                mapUrl: branch.mapUrl,
                ownerId: userId,
                profile: {
                  create: {
                    bio:
                      branch.bio ||
                      'Chào mừng bạn đến với nhà hàng của chúng tôi!',
                    openingHours: branch.openingHours || '00:00 - 00:00',
                  },
                },
              },
            });
          }
        }
      });
    }

    // 3. Cập nhật trạng thái hoàn thành Onboarding
    await this.userRepository.upsertProfile(userId, {
      hasCompletedOnboarding: true,
      preferences:
        user.role === UserRole.CUSTOMER
          ? (dto.preferences as Prisma.InputJsonValue)
          : undefined,
    });

    return { message: 'Hoàn thiện hồ sơ đa chi nhánh thành công.' };
  }

  async changePassword(userId: number, oldPass?: string, newPass?: string) {
    if (!newPass) {
      throw new BadRequestException('Mật khẩu mới không được để trống');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Nếu có mật khẩu cũ thì phải kiểm tra (trường hợp user đã có mật khẩu)
    if (user.password && oldPass) {
      const isValid = await BcryptHelper.compare(oldPass, user.password);
      if (!isValid)
        throw new UnauthorizedException('Mật khẩu cũ không chính xác');
    }

    const hashedPassword = await BcryptHelper.hash(newPass, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async deleteAccount(userId: number, password?: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (!password) {
      throw new BadRequestException(
        'Vui lòng cung cấp mật khẩu để xác nhận xóa tài khoản',
      );
    }

    const isPasswordValid = await BcryptHelper.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Mật khẩu không chính xác. Không thể xóa tài khoản',
      );
    }

    // Thực hiện hard delete thông tin người dùng trong Database thông qua transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Xóa các followings & followers liên quan đến User
      await tx.userFollow.deleteMany({
        where: {
          OR: [{ followerId: userId }, { followingId: userId }],
        },
      });

      // 2. Xóa các lượt theo dõi nhà hàng
      await tx.follow.deleteMany({
        where: { userId },
      });

      // 3. Xóa các lượt yêu thích (favorites)
      await tx.favorite.deleteMany({
        where: { userId },
      });

      // 4. Xóa hồ sơ cá nhân (UserProfile)
      await tx.userProfile.deleteMany({
        where: { userId },
      });

      // 5. Nếu user là RESTAURANT (Merchant), thực hiện xóa/update các nhà hàng của họ
      if (user.role === UserRole.RESTAURANT) {
        // Tìm các nhà hàng của user này
        const restaurants = await tx.restaurant.findMany({
          where: { ownerId: userId },
        });
        const restaurantIds = restaurants.map((r) => r.id);

        if (restaurantIds.length > 0) {
          // Xóa hồ sơ nhà hàng
          await tx.restaurantProfile.deleteMany({
            where: { restaurantId: { in: restaurantIds } },
          });

          // Cập nhật các món ăn của nhà hàng này về null restaurantId hoặc xóa món ăn tùy business
          // Ở đây, vì cascade schema, chúng ta sẽ xóa các món ăn thuộc các nhà hàng này
          await tx.food.deleteMany({
            where: { restaurantId: { in: restaurantIds } },
          });

          // Xóa bản thân các nhà hàng
          await tx.restaurant.deleteMany({
            where: { ownerId: userId },
          });
        }
      }

      // 6. Xóa chính User
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return {
      message: 'Tài khoản của bạn đã được xóa vĩnh viễn khỏi hệ thống.',
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.userRepository.findById(Number(payload.sub));

      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateToken(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateToken(user: User & { profile?: UserProfile | null }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: appConfig().jwtAccessExpiration as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: appConfig().jwtRefreshExpiration as any,
    });

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.profile?.avatar,
        role: user.role,
        hasCompletedOnboarding: user.profile?.hasCompletedOnboarding || false,
      },
    };
  }
}
