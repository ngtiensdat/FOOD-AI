// Mục đích: Định nghĩa service thực hiện logic nghiệp vụ cho Quản lý thiết bị POS của nhà hàng.
// File quan hệ: Kết nối với PrismaService để thao tác dữ liệu POS, được gọi bởi PosTerminalController, OrderService.
// Chức năng đặc biệt: Tạo/cập nhật/xóa tài khoản máy POS, đăng nhập/đăng xuất thiết bị POS, kiểm soát duy nhất một phiên hoạt động đồng thời và ghi nhật ký hoạt động chi tiết.
// Kiến thức/Design Pattern: Single Responsibility Principle, Concurrency control, Bcrypt hashing.
import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BcryptHelper } from '../../common/utils/bcrypt.helper';
import { CreatePosTerminalDto } from './dto/create-pos-terminal.dto';
import { UpdatePosTerminalDto } from './dto/update-pos-terminal.dto';
import { LoginPosTerminalDto } from './dto/login-pos-terminal.dto';
import { User, UserRole } from '@prisma/client';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class PosTerminalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async create(dto: CreatePosTerminalDto, user: User) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Không tìm thấy chi nhánh nhà hàng.');
    }
    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền quản lý nhà hàng này.');
    }

    const existingCode = await this.prisma.posTerminal.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new ConflictException('Mã máy POS này đã tồn tại trên hệ thống.');
    }

    const existingName = await this.prisma.posTerminal.findUnique({
      where: {
        restaurantId_name: {
          restaurantId: dto.restaurantId,
          name: dto.name,
        },
      },
    });
    if (existingName) {
      throw new ConflictException(
        'Tên máy POS này đã được sử dụng tại chi nhánh.',
      );
    }

    const hashedPassword = await BcryptHelper.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const terminal = await tx.posTerminal.create({
        data: {
          name: dto.name,
          code: dto.code,
          password: hashedPassword,
          restaurantId: dto.restaurantId,
        },
      });

      await tx.posTerminalLog.create({
        data: {
          terminalId: terminal.id,
          userId: user.id,
          action: 'CREATE_TERMINAL',
          details: `Khởi tạo tài khoản máy POS: ${dto.name} (Mã: ${dto.code})`,
        },
      });

      return terminal;
    });
  }

  async update(id: number, dto: UpdatePosTerminalDto, user: User) {
    const terminal = await this.prisma.posTerminal.findUnique({
      where: { id },
      include: { restaurant: true },
    });
    if (!terminal) {
      throw new NotFoundException('Không tìm thấy máy POS.');
    }

    if (
      user.role === UserRole.RESTAURANT &&
      terminal.restaurant.ownerId !== user.id
    ) {
      throw new ForbiddenException('Bạn không có quyền cập nhật máy POS này.');
    }

    const updateData: any = {};
    if (dto.name !== undefined) {
      if (dto.name !== terminal.name) {
        const existingName = await this.prisma.posTerminal.findUnique({
          where: {
            restaurantId_name: {
              restaurantId: terminal.restaurantId,
              name: dto.name,
            },
          },
        });
        if (existingName) {
          throw new ConflictException(
            'Tên máy POS này đã được sử dụng tại chi nhánh.',
          );
        }
      }
      updateData.name = dto.name;
    }

    if (dto.password !== undefined) {
      updateData.password = await BcryptHelper.hash(dto.password, 10);
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.posTerminal.update({
        where: { id },
        data: updateData,
      });

      let details = `Cập nhật thông tin máy POS: ${terminal.name}.`;
      if (dto.isActive !== undefined) {
        details += ` Trạng thái: ${dto.isActive ? 'Hoạt động' : 'Tạm dừng'}.`;
      }
      if (dto.password !== undefined) {
        details += ` Thay đổi mật khẩu đăng nhập.`;
      }

      await tx.posTerminalLog.create({
        data: {
          terminalId: id,
          userId: user.id,
          action: 'UPDATE_TERMINAL',
          details,
        },
      });

      return updated;
    });
  }

  async delete(id: number, user: User) {
    const terminal = await this.prisma.posTerminal.findUnique({
      where: { id },
      include: { restaurant: true },
    });
    if (!terminal) {
      throw new NotFoundException('Không tìm thấy máy POS.');
    }

    if (
      user.role === UserRole.RESTAURANT &&
      terminal.restaurant.ownerId !== user.id
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa máy POS này.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.posTerminal.delete({
        where: { id },
      });
      return { success: true };
    });
  }

  async findAllForRestaurant(restaurantId: number, user: User) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Không tìm thấy nhà hàng.');
    }

    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin của nhà hàng này.',
      );
    } else if (
      user.role === UserRole.STAFF &&
      user.restaurantId !== restaurantId
    ) {
      throw new ForbiddenException('Bạn không thuộc chi nhánh nhà hàng này.');
    }

    return this.prisma.posTerminal.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });
  }

  async getLogs(restaurantId: number, user: User) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Không tìm thấy nhà hàng.');
    }

    if (user.role === UserRole.RESTAURANT && restaurant.ownerId !== user.id) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập nhật ký của nhà hàng này.',
      );
    } else if (
      user.role === UserRole.STAFF &&
      user.restaurantId !== restaurantId
    ) {
      throw new ForbiddenException('Bạn không thuộc chi nhánh nhà hàng này.');
    }

    return this.prisma.posTerminalLog.findMany({
      where: {
        terminal: { restaurantId },
      },
      include: {
        terminal: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async login(dto: LoginPosTerminalDto, user: User) {
    const terminal = await this.prisma.posTerminal.findUnique({
      where: { code: dto.code },
      include: { restaurant: true },
    });
    if (!terminal) {
      throw new UnauthorizedException(
        'Mã máy POS hoặc mật khẩu không chính xác.',
      );
    }

    if (!terminal.isActive) {
      throw new ForbiddenException(
        'Máy POS này hiện đã bị tạm dừng hoạt động.',
      );
    }

    if (
      user.role === UserRole.STAFF &&
      user.restaurantId !== terminal.restaurantId
    ) {
      throw new ForbiddenException(
        'Bạn không thuộc chi nhánh sở hữu máy POS này.',
      );
    } else if (
      user.role === UserRole.RESTAURANT &&
      terminal.restaurant.ownerId !== user.id
    ) {
      throw new ForbiddenException('Bạn không sở hữu chi nhánh này.');
    }

    const isPasswordValid = await BcryptHelper.compare(
      dto.password,
      terminal.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Mã máy POS hoặc mật khẩu không chính xác.',
      );
    }

    const previousUserId = terminal.currentUserId;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.posTerminal.update({
        where: { id: terminal.id },
        data: { currentUserId: user.id },
      });

      if (previousUserId && previousUserId !== user.id) {
        const previousUser = await tx.user.findUnique({
          where: { id: previousUserId },
        });
        await tx.posTerminalLog.create({
          data: {
            terminalId: terminal.id,
            userId: user.id,
            action: 'LOGIN_OVERRIDE',
            details: `Nhân viên ${user.name} đăng nhập chiếm quyền sử dụng máy POS của nhân viên ${previousUser?.name || 'Chưa rõ'}.`,
          },
        });
      } else {
        await tx.posTerminalLog.create({
          data: {
            terminalId: terminal.id,
            userId: user.id,
            action: 'LOGIN',
            details: `Đăng nhập máy POS thành công.`,
          },
        });
      }

      return {
        id: terminal.id,
        name: terminal.name,
        code: terminal.code,
        restaurantId: terminal.restaurantId,
      };
    });

    // Phát sự kiện real-time để kick user trước đó ra khỏi máy POS
    if (previousUserId && previousUserId !== user.id && this.gateway.server) {
      this.gateway.server.to(`user_${previousUserId}`).emit('pos_kicked', {
        terminalId: terminal.id,
        terminalName: terminal.name,
        kickedBy: user.name,
      });
    }

    return result;
  }

  async logout(id: number, user: User) {
    const terminal = await this.prisma.posTerminal.findUnique({
      where: { id },
    });
    if (!terminal) {
      throw new NotFoundException('Không tìm thấy máy POS.');
    }

    if (terminal.currentUserId !== user.id) {
      return { success: true };
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.posTerminal.update({
        where: { id },
        data: { currentUserId: null },
      });

      await tx.posTerminalLog.create({
        data: {
          terminalId: id,
          userId: user.id,
          action: 'LOGOUT',
          details: `Đăng xuất máy POS thành công.`,
        },
      });

      return { success: true };
    });
  }

  async verifyActiveSession(terminalId: number, userId: number) {
    const terminal = await this.prisma.posTerminal.findUnique({
      where: { id: terminalId },
    });
    if (!terminal) {
      throw new ForbiddenException('POS_SESSION_EXPIRED');
    }
    if (terminal.currentUserId !== userId) {
      throw new ForbiddenException('POS_SESSION_EXPIRED');
    }
    if (!terminal.isActive) {
      throw new ForbiddenException('POS_SESSION_EXPIRED');
    }
  }
}
