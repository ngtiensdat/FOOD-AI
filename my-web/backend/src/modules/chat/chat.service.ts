import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateDirectChatDto,
  CreateGroupChatDto,
  SendDirectMessageDto,
} from './dto/chat.dto';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly gateway: NotificationGateway,
  ) {}

  async getConversations(userId: number, type: 'inbox' | 'requests') {
    const isAccepted = type === 'inbox';

    const participants = await this.prisma.directParticipant.findMany({
      where: {
        userId,
        isAccepted,
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    profile: {
                      select: {
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    return participants.map((p) => {
      const conv = p.conversation;
      // Get the unread count for this user in this conversation
      // In a real app we might query this, for simplicity we can calculate it or mock it.
      return {
        id: conv.id,
        name: conv.name,
        isGroup: conv.isGroup,
        creatorId: conv.creatorId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        participants: conv.participants.map((part) => ({
          id: part.user.id,
          name: part.user.name,
          email: part.user.email,
          role: part.user.role,
          avatar: part.user.profile?.avatar || null,
          isAccepted: part.isAccepted,
        })),
        lastMessage: conv.messages[0] || null,
      };
    });
  }

  async getMessages(conversationId: number, userId: number) {
    // Check if user is participant
    const part = await this.prisma.directParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!part) {
      throw new NotFoundException(
        'Không tìm thấy cuộc trò chuyện hoặc bạn không tham gia',
      );
    }

    // Mark messages as read
    await this.prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return this.prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async createDirectChat(senderId: number, dto: CreateDirectChatDto) {
    const { recipientId } = dto;
    if (senderId === recipientId) {
      throw new BadRequestException('Không thể trò chuyện với chính mình');
    }

    // Check if conversation already exists
    const existing = await this.prisma.directConversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [senderId, recipientId] },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    if (existing && existing.participants.length === 2) {
      return existing;
    }

    // Check follow relationship to see if it starts as accepted or request
    const follows1 = await this.prisma.userFollow.findFirst({
      where: { followerId: senderId, followingId: recipientId },
    });
    const follows2 = await this.prisma.userFollow.findFirst({
      where: { followerId: recipientId, followingId: senderId },
    });

    const recipientUser = await this.prisma.user.findUnique({
      where: { id: recipientId },
      include: { restaurants: true },
    });
    const senderUser = await this.prisma.user.findUnique({
      where: { id: senderId },
      include: { restaurants: true },
    });

    let isFollowedMerchant = false;
    if (recipientUser?.restaurants && recipientUser.restaurants.length > 0) {
      const restIds = recipientUser.restaurants.map((r) => r.id);
      const follow = await this.prisma.follow.findFirst({
        where: { userId: senderId, restaurantId: { in: restIds } },
      });
      if (follow) isFollowedMerchant = true;
    }
    if (senderUser?.restaurants && senderUser.restaurants.length > 0) {
      const restIds = senderUser.restaurants.map((r) => r.id);
      const follow = await this.prisma.follow.findFirst({
        where: { userId: recipientId, restaurantId: { in: restIds } },
      });
      if (follow) isFollowedMerchant = true;
    }

    // Mutual follow or followed merchant means auto accepted
    const isAcceptedMutual = !!((follows1 && follows2) || isFollowedMerchant);

    return this.prisma.$transaction(async (tx) => {
      const conv = await tx.directConversation.create({
        data: {
          isGroup: false,
        },
      });

      await tx.directParticipant.createMany({
        data: [
          {
            conversationId: conv.id,
            userId: senderId,
            isAccepted: true, // Sender automatically accepts
          },
          {
            conversationId: conv.id,
            userId: recipientId,
            isAccepted: isAcceptedMutual, // Recipient accepts only if mutual follow
          },
        ],
      });

      return conv;
    });
  }

  async createGroupChat(creatorId: number, dto: CreateGroupChatDto) {
    const participantIds = Array.from(
      new Set([creatorId, ...dto.participantIds]),
    );

    return this.prisma.$transaction(async (tx) => {
      const conv = await tx.directConversation.create({
        data: {
          name: dto.name,
          isGroup: true,
          creatorId,
        },
      });

      await tx.directParticipant.createMany({
        data: participantIds.map((userId) => ({
          conversationId: conv.id,
          userId,
          isAccepted: true, // Group participants automatically join
        })),
      });

      return conv;
    });
  }

  async sendMessage(
    senderId: number,
    conversationId: number,
    dto: SendDirectMessageDto,
  ) {
    // Verify participant
    const part = await this.prisma.directParticipant.findFirst({
      where: { conversationId, userId: senderId },
    });
    if (!part) {
      throw new NotFoundException(
        'Không thể gửi tin nhắn vào cuộc trò chuyện này',
      );
    }

    const message = await this.prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Update conversation updatedAt
    await this.prisma.directConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Realtime broadcast via Socket
    const participants = await this.prisma.directParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    participants.forEach((p) => {
      if (this.gateway.server) {
        this.gateway.server.to(`user_${p.userId}`).emit('direct_message', {
          conversationId,
          message,
        });
      }
    });

    return message;
  }

  async acceptRequest(userId: number, conversationId: number) {
    const part = await this.prisma.directParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!part) {
      throw new NotFoundException('Không tìm thấy yêu cầu tin nhắn');
    }

    return this.prisma.directParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { isAccepted: true },
    });
  }

  async getSearchUsers(query: string, currentUserId: number) {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();

    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: {
          select: {
            avatar: true,
          },
        },
      },
      take: 10,
    });
  }
}
