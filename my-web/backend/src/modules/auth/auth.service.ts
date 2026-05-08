import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const { email, password, name, role, legalDocuments } = data;

    // 1. Validation cơ bản
    if (!name || name.trim().length < 2) {
      throw new ConflictException('Tên phải có ít nhất 2 ký tự');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new ConflictException('Email không hợp lệ');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      throw new ConflictException(
        'Mật khẩu phải tối thiểu 8 ký tự, bao gồm cả chữ và số',
      );
    }

    // 2. Kiểm tra tài liệu cho Nhà hàng
    if (
      role === 'RESTAURANT' &&
      (!legalDocuments || legalDocuments.trim().length < 10)
    ) {
      throw new ConflictException(
        'Thương gia cần cung cấp thông tin giấy tờ pháp lý hợp lệ',
      );
    }

    // 3. Kiểm tra user tồn tại
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    // 4. Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    // 4.5 Tạo Token xác minh ngẫu nhiên
    const verificationToken = crypto.randomUUID();

    // 5. Xác định trạng thái (Nhà hàng cần Admin duyệt)
    const finalRole = (role || 'CUSTOMER').toUpperCase();
    const status = finalRole === 'RESTAURANT' ? 'PENDING' : 'APPROVED';

    // 6. Tạo user mới kèm theo Profile tự động
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: finalRole,
        status: status as any,
        legalDocuments: finalRole === 'RESTAURANT' ? legalDocuments : null,
        isEmailVerified: true,
        // Tự động tạo Profile
        profile: {
          create: {
            fullName: name,
          },
        },
        // Nếu là Nhà hàng, tự động tạo luôn bản ghi Restaurant và Profile của nó
        ...(role === 'RESTAURANT'
          ? {
              restaurants: {
                create: {
                  name: `Nhà hàng của ${name}`,
                  address: 'Chưa cập nhật',
                  latitude: 10.762622, // Tọa độ mặc định (HCMC) hoặc lấy từ client nếu có
                  longitude: 106.660172,
                  // Tự động tạo RestaurantProfile
                  profile: {
                    create: {
                      bio: 'Chào mừng bạn đến với nhà hàng của chúng tôi!',
                      openingHours: '09:00 - 21:00',
                    },
                  },
                },
              },
            }
          : {}),
      },
    });

    if (status === 'PENDING') {
      return {
        message:
          'Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt.',
        status: 'PENDING',
      };
    }

    return this.generateToken(user);
  }

  async login(data: any) {
    const { email, password } = data;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === 'PENDING') {
      throw new UnauthorizedException(
        'Tài khoản của bạn đang chờ phê duyệt, vui lòng quay lại sau',
      );
    }
    if (user.status === 'REJECTED') {
      throw new UnauthorizedException(
        'Tài khoản của bạn đã bị từ chối truy cập',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    return this.generateToken(user);
  }

  async changePassword(data: any) {
    const { userId, oldPassword, newPassword } = data;

    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new ConflictException(
        'Mật khẩu mới phải tối thiểu 8 ký tự, bao gồm cả chữ và số',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword },
    });

    return { message: 'Đổi mật khẩu thành công!' };
  }

  async verifyProfileEmail(data: any) {
    const { userId, email } = data;
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (user.email !== email) {
      throw new ConflictException(
        'Email nhập vào không chính xác với email đã đăng ký',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    return { message: 'Xác minh Email thành công!' };
  }
  async updateProfile(userId: number, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, restaurants: { include: { profile: true } } },
    });

    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');

    // 1. Cập nhật thông tin cơ bản trong UserProfile
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        fullName: data.name || data.fullName,
        phone: data.phone,
        avatar: data.avatar,
        coverImage: data.coverImage,
        bio: data.bio,
        address: data.address,
        workAt: data.workAt,
      },
    });

    // 2. Nếu là Thương gia, cập nhật thêm vào RestaurantProfile của TẤT CẢ nhà hàng sở hữu (hoặc cái chính)
    if (user.role === 'RESTAURANT' && user.restaurants.length > 0) {
      for (const restaurant of user.restaurants) {
        await this.prisma.restaurantProfile.update({
          where: { restaurantId: restaurant.id },
          data: {
            coverImage: data.coverImage,
            bio: data.bio,
            contactEmail: data.email || data.contactEmail,
            contactPhone: data.phone || data.contactPhone,
          },
        });
      }
    }

    // 3. Cập nhật tên trong bảng User
    if (data.name) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name: data.name },
      });
    }

    return { message: 'Cập nhật trang cá nhân thành công!' };
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.profile?.avatar,
        role: user.role,
        hasCompletedOnboarding: user.profile?.hasCompletedOnboarding || false,
        profile: user.profile,
      },
    };
  }
}
