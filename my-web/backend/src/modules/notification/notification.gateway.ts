// Mục đích: Định nghĩa WebSocket Gateway cho hệ thống thông báo thời gian thực (real-time notifications).
// File quan hệ: Kết nối trực tiếp với Next.js Client, lưu thông báo qua NotificationRepository và được gọi bởi các Service nghiệp vụ.
// Chức năng đặc biệt: Tự động lưu thông báo vào Database trước khi đẩy qua WebSocket nếu User đang online.

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private activeConnections = new Map<number, string>(); // userId -> socket.id

  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(
          `[WebSocket] Rejecting connection: No authentication token found. Client: ${client.id}`,
        );
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string | number }>(token);
      const userId = Number(payload.sub);

      if (isNaN(userId)) {
        this.logger.warn(
          `[WebSocket] Rejecting connection: Invalid userId in token. Client: ${client.id}`,
        );
        client.disconnect();
        return;
      }

      client.data = { ...client.data, userId };
      client.join(`user_${userId}`);
      this.logger.log(
        `[WebSocket] Authenticated user connected: ID ${userId}, Socket: ${client.id}`,
      );
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `[WebSocket] Authentication failed for client ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) {
      this.logger.warn(
        `[WebSocket] Ignored register event: Socket ${client.id} is not authenticated.`,
      );
      return { status: 'error', message: 'Unauthorized' };
    }
    client.join(`user_${userId}`);
    this.logger.log(
      `[WebSocket] User ${userId} registered socket: ${client.id}`,
    );
    return { status: 'registered' };
  }

  private extractToken(client: Socket): string | null {
    // 1. From auth handshake payload
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // 2. From handshake Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    // 3. From handshake Cookie header (accessToken)
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('accessToken='));
      if (match) {
        return match.split('=')[1];
      }
    }

    // 4. Fallback: query parameters
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    return null;
  }

  async sendNotificationToUser(
    userId: number,
    data: {
      type: NotificationType;
      title: string;
      content: string;
      senderId?: number;
      postId?: number;
    },
  ) {
    // 1. Lưu vào Database trước
    const notification = await this.notificationRepo.create({
      userId,
      title: data.title,
      content: data.content,
      type: data.type,
      senderId: data.senderId,
      postId: data.postId,
    });

    // 2. Phát thời gian thực cho tất cả các thiết bị/tab của user
    this.server.to(`user_${userId}`).emit('notification', {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      type: notification.type,
      senderId: notification.senderId,
      postId: notification.postId,
      createdAt: notification.createdAt.toISOString(),
    });
    this.logger.log(
      `[WebSocket] Real-time notification emitted to Room user_${userId}`,
    );

    return notification;
  }
}
