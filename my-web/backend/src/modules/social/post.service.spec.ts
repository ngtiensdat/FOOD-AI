jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((val: string): string => val),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, Post, Comment } from '@prisma/client';
import { NotificationGateway } from '../notification/notification.gateway';
import { GamificationQueueService } from '../badge/gamification-queue.service';

describe('PostService', () => {
  let service: PostService;
  let prisma: PrismaService;
  let cacheService: CacheService;
  let gamificationQueue: GamificationQueueService;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      badgeConfig: {
        findMany: jest.fn(() => []),
      },
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      like: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      comment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockCacheService = {
      wrap: jest.fn(
        <T>(key: string, fetchFn: () => Promise<T>): Promise<T> => fetchFn(),
      ),
      invalidatePattern: jest.fn(),
    };

    const mockNotificationGateway = {
      sendNotificationToUser: jest.fn(),
    };

    const mockGamificationQueueService = {
      addJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
        {
          provide: GamificationQueueService,
          useValue: mockGamificationQueueService,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
    gamificationQueue = module.get<GamificationQueueService>(
      GamificationQueueService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should successfully create post, award points and invalidate cache', async () => {
      const mockPost = {
        id: 1,
        title: 'My Post',
        content: 'Delicious Pho',
      } as unknown as Post;
      const createSpy = jest
        .spyOn(prisma.post, 'create')
        .mockResolvedValue(mockPost);
      const addJobSpy = jest.spyOn(gamificationQueue, 'addJob');
      const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');

      const result = await service.createPost(1, {
        title: 'My Post',
        content: 'Delicious Pho',
      });

      expect(result).toEqual(mockPost);
      expect(createSpy).toHaveBeenCalled();
      expect(addJobSpy).toHaveBeenCalledWith(1, 'POST_REVIEW');
      expect(invalidateSpy).toHaveBeenCalledWith('posts:*');
    });
  });

  describe('deleteComment', () => {
    it('should throw NotFoundException if comment does not exist', async () => {
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(null);
      await expect(
        service.deleteComment(1, UserRole.CUSTOMER, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author or commenter', async () => {
      const mockComment = {
        id: 1,
        userId: 2,
        post: { authorId: 3 },
      } as unknown as Comment;
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment);

      await expect(
        service.deleteComment(1, UserRole.CUSTOMER, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully delete comment and invalidate cache', async () => {
      const mockComment = {
        id: 1,
        userId: 1,
        post: { authorId: 3 },
      } as unknown as Comment;
      const mockDeletedComment = { id: 1 } as unknown as Comment;

      const findSpy = jest
        .spyOn(prisma.comment, 'findUnique')
        .mockResolvedValue(mockComment);
      const deleteSpy = jest
        .spyOn(prisma.comment, 'delete')
        .mockResolvedValue(mockDeletedComment);
      const addJobSpy = jest.spyOn(gamificationQueue, 'addJob');
      const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');

      const result = await service.deleteComment(1, UserRole.CUSTOMER, 1);
      expect(result.success).toBe(true);
      expect(findSpy).toHaveBeenCalled();
      expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(addJobSpy).toHaveBeenCalledWith(1, 'UNDO_COMMENT');
      expect(invalidateSpy).toHaveBeenCalledWith('posts:*');
    });
  });
});
