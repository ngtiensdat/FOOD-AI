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
import DOMPurify from 'isomorphic-dompurify';
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
import { RedisService } from '../../common/redis/redis.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private aiService: AiService,
    private prisma: PrismaService,
    private redisService: RedisService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(MESSAGES.AUTH.USER_EXISTS);
    }

    const sanitizedName = dto.name
      ? DOMPurify.sanitize(dto.name, { ALLOWED_TAGS: [] })
      : dto.name;
    const hashedPassword = await BcryptHelper.hash(dto.password, 10);
    const status =
      dto.role === UserRole.RESTAURANT
        ? UserStatus.PENDING
        : UserStatus.APPROVED;

    // Sinh mã OTP 6 số và băm SHA-256
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: sanitizedName,
      role: dto.role || UserRole.CUSTOMER,
      status,
      isEmailVerified: false,
      verificationOtpHash: otpHash,
      verificationOtpExpiresAt: otpExpires,
      lastOtpRequestedAt: new Date(),
      profile: {
        create: {
          fullName: sanitizedName,
        },
      },
      ...(dto.role === UserRole.RESTAURANT
        ? {
            legalDocuments: dto.legalDocuments,
          }
        : {}),
    });

    // Gửi email OTP
    await this.mailService.sendVerificationOtpEmail(
      dto.email,
      sanitizedName || 'Thành viên',
      otp,
    );

    return {
      message:
        'Đăng ký thành công. Mã OTP xác thực đã được gửi tới email của bạn.',
      email: user.email,
    };
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

    // Không chặn đăng nhập nếu email chưa xác thực — frontend sẽ hiển thị thông báo nhắc nhở

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

  async verifyEmail(email: string, otp: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email đã được xác thực trước đó.');
    }

    if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
      throw new BadRequestException(
        'Không tìm thấy yêu cầu xác thực hoặc mã OTP đã hết hạn.',
      );
    }

    const now = new Date();
    if (now > user.verificationOtpExpiresAt) {
      throw new BadRequestException(
        'Mã xác thực OTP đã hết hạn. Vui lòng yêu cầu gửi lại.',
      );
    }

    const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (inputHash !== user.verificationOtpHash) {
      throw new BadRequestException('Mã xác thực OTP không chính xác.');
    }

    // Cập nhật trạng thái xác thực và xóa OTP
    const updatedUser = await this.userRepository.update(user.id, {
      isEmailVerified: true,
      verificationOtpHash: null,
      verificationOtpExpiresAt: null,
    });

    if (updatedUser.status === UserStatus.PENDING) {
      return {
        message:
          'Xác thực email thành công. Tài khoản của bạn đang chờ quản trị viên phê duyệt.',
        status: UserStatus.PENDING,
      };
    }

    // Auto login
    return this.generateToken(updatedUser);
  }

  async resendOtp(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email đã được xác thực trước đó.');
    }

    const now = new Date();
    if (user.lastOtpRequestedAt) {
      const diff = now.getTime() - user.lastOtpRequestedAt.getTime();
      if (diff < 60000) {
        const remaining = Math.ceil((60000 - diff) / 1000);
        throw new BadRequestException(
          `Vui lòng đợi ${remaining} giây trước khi yêu cầu gửi lại mã.`,
        );
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await this.userRepository.update(user.id, {
      verificationOtpHash: otpHash,
      verificationOtpExpiresAt: otpExpires,
      lastOtpRequestedAt: now,
    });

    await this.mailService.sendVerificationOtpEmail(
      email,
      user.name || 'Thành viên',
      otp,
    );

    return { message: 'Đã gửi lại mã xác thực OTP mới.' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    // Tránh enum attack: Không báo lỗi nếu email không tồn tại
    if (!user) {
      return {
        message:
          'Nếu email tồn tại trên hệ thống, mã OTP khôi phục mật khẩu đã được gửi.',
      };
    }

    // Chỉ gửi OTP reset mật khẩu khi email đã được xác thực
    if (!user.isEmailVerified) {
      return {
        message:
          'Nếu email tồn tại trên hệ thống, mã OTP khôi phục mật khẩu đã được gửi.',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await this.userRepository.update(user.id, {
      resetOtpHash: otpHash,
      resetOtpExpiresAt: otpExpires,
    });

    await this.mailService.sendResetPasswordOtpEmail(
      email,
      user.name || 'Thành viên',
      otp,
    );

    return {
      message: 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.',
    };
  }

  async resetPassword(email: string, otp: string, newPass: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
      throw new BadRequestException(
        'Yêu cầu khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.',
      );
    }

    const now = new Date();
    if (now > user.resetOtpExpiresAt) {
      throw new BadRequestException('Mã khôi phục mật khẩu OTP đã hết hạn.');
    }

    const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (inputHash !== user.resetOtpHash) {
      throw new BadRequestException(
        'Mã OTP khôi phục mật khẩu không chính xác.',
      );
    }

    const hashedPassword = await BcryptHelper.hash(newPass, 10);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetOtpHash: null,
      resetOtpExpiresAt: null,
    });

    return {
      message:
        'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
    };
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

    return { message: MESSAGES.AUTH.ONBOARDING_SUCCESS };
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
    return { message: MESSAGES.AUTH.CHANGE_PASSWORD_SUCCESS };
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

    // Soft delete: đánh dấu xóa thay vì xóa vĩnh viễn (cho phục hồi & audit)
    await this.prisma.$transaction(async (tx) => {
      // 1. Đánh dấu user đã bị xóa
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          refreshToken: null,
          email: `deleted_${userId}_${user.email}`, // Giải phóng email để người khác đăng ký
        },
      });

      // 2. Vô hiệu hóa tất cả restaurants của user
      await tx.restaurant.updateMany({
        where: { ownerId: userId },
        data: { isActive: false, deletedAt: new Date() },
      });
    });

    return {
      message: MESSAGES.AUTH.DELETE_ACCOUNT_SUCCESS,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.userRepository.findById(Number(payload.sub));

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException(MESSAGES.AUTH.INVALID_TOKEN);
      }

      const isMatch = await BcryptHelper.compare(token, user.refreshToken);
      if (!isMatch) {
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
      expiresIn: appConfig().jwtAccessExpiration as '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: appConfig().jwtRefreshExpiration as '1d',
    });

    const hashedRefreshToken = await BcryptHelper.hash(refreshToken, 10);
    await this.userRepository.updateRefreshToken(user.id, hashedRefreshToken);

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
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}
