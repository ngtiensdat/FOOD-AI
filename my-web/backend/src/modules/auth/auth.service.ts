// Mục đích: Cung cấp dịch vụ xác thực và quản lý tài khoản người dùng (đăng ký, đăng nhập, đổi mật khẩu, onboarding và xóa tài khoản).
// File quan hệ: Gọi UserRepository, JwtService, AiService, PrismaService, sử dụng BcryptHelper và được gọi bởi AuthController, JwtStrategy.
// Chức năng đặc biệt: Phát hành Access Token & Refresh Token, Onboarding đa chi nhánh với transaction, hard delete tài khoản và dọn dẹp các mối quan hệ (followers, favorites, restaurants...) an toàn.
// Kiến thức/Design Pattern: Security Best Practices (Bcrypt hashing, HTTP-Only Cookie tokens), SOLID (Single Responsibility, Dependency Inversion), Transaction Pattern, Logging Pattern (NestJS Logger).
// Các biến, hàm đặc biệt: register(), login(), getProfile(), completeOnboarding(), changePassword(), deleteAccount(), refreshToken(), generateToken().

import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
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
import { RedisService } from '../ai/services/redis.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private aiService: AiService,
    private prisma: PrismaService,
    private redisService: RedisService,
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
    this.logger.log(`Attempting login for: ${dto.email}`);

    const attemptsKey = `login_attempts:${dto.email}`;
    const lockKey = `login_lock:${dto.email}`;

    // 1. Kiểm tra xem tài khoản có đang bị khóa hay không
    const isLocked = await this.redisService.get(lockKey);
    if (isLocked) {
      const remainingSeconds = await this.redisService.ttl(lockKey);
      const remainingMinutes =
        remainingSeconds > 0 ? Math.ceil(remainingSeconds / 60) : 10;
      throw new UnauthorizedException(
        MESSAGES.AUTH.RATE_LIMIT_LOGIN_DYNAMIC(remainingMinutes),
      );
    }

    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`User not found: ${dto.email}`);
      throw new NotFoundException(MESSAGES.AUTH.NOT_REGISTERED);
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(MESSAGES.AUTH.PENDING_APPROVAL);
    }
    if (user.status === UserStatus.REJECTED) {
      throw new UnauthorizedException(MESSAGES.AUTH.ACCOUNT_REJECTED);
    }

    const isPasswordValid = await BcryptHelper.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for: ${dto.email}`);

      // 2. Tăng số lần đăng nhập sai (atomic)
      const attempts = await this.redisService.incr(attemptsKey, 600);

      const maxAttempts = 3;
      const remainingAttempts = maxAttempts - attempts;

      if (attempts >= maxAttempts) {
        // Đã nhập sai 3 lần, thực hiện khóa 10 phút (600 giây)
        await this.redisService.set(lockKey, 'locked', 600);
        await this.redisService.del(attemptsKey);
        throw new UnauthorizedException(MESSAGES.AUTH.RATE_LIMIT_LOGIN_10M);
      } else {
        throw new UnauthorizedException(
          MESSAGES.AUTH.LOGIN_ATTEMPTS_REMAINING(remainingAttempts),
        );
      }
    }

    // 3. Đăng nhập thành công, xóa lịch sử thử đăng nhập sai và khóa nếu có
    await this.redisService.del(attemptsKey);
    await this.redisService.del(lockKey);

    this.logger.log(`Login successful: ${dto.email}`);
    return this.generateToken(user);
  }

  async getProfile(targetId: number, requesterId?: number) {
    const user = await this.userRepository.findById(targetId);
    if (!user) throw new NotFoundException(MESSAGES.USER.NOT_FOUND);

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
    if (!user) throw new NotFoundException(MESSAGES.USER.NOT_FOUND);

    if (user.role === UserRole.RESTAURANT) {
      const branches = dto.branches;
      if (!branches || branches.length === 0) {
        throw new BadRequestException(MESSAGES.AUTH.MERCHANT_BRANCH_REQUIRED);
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
      throw new BadRequestException(MESSAGES.AUTH.NEW_PASSWORD_REQUIRED);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException(MESSAGES.USER.NOT_FOUND);

    // Nếu có mật khẩu cũ thì phải kiểm tra (trường hợp user đã có mật khẩu)
    if (user.password && oldPass) {
      const isValid = await BcryptHelper.compare(oldPass, user.password);
      if (!isValid)
        throw new UnauthorizedException(MESSAGES.AUTH.OLD_PASSWORD_INCORRECT);
    }

    const hashedPassword = await BcryptHelper.hash(newPass, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async deleteAccount(userId: number, password?: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    if (!password) {
      throw new BadRequestException(MESSAGES.AUTH.PASSWORD_CONFIRM_REQUIRED);
    }

    const isPasswordValid = await BcryptHelper.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(MESSAGES.AUTH.PASSWORD_INCORRECT_DELETE);
    }

    // Nhờ cấu hình onDelete: Cascade trong schema.prisma, việc xóa User sẽ tự động xóa sạch các dữ liệu liên quan ở tầng DB
    await this.prisma.user.delete({
      where: { id: userId },
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
        throw new UnauthorizedException(MESSAGES.AUTH.INVALID_TOKEN);
      }

      return this.generateToken(user);
    } catch {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_TOKEN);
    }
  }

  async generateToken(user: User & { profile?: UserProfile | null }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      // Ép kiểu 'as any' là bắt buộc ở đây do thuộc tính 'expiresIn' sử dụng kiểu dữ liệu 'StringValue'
      // quá nghiêm ngặt của gói 'ms' (chặn kiểu dữ liệu 'string' động của env).
      expiresIn: appConfig().jwtAccessExpiration as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
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
