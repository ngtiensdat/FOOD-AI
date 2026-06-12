jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((val) => val),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PostService', () => {
  let service: PostService;
  let prisma: any;
  let cacheService: any;

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
      },
    };

    const mockCacheService = {
      wrap: jest.fn((key, fetchFn) => fetchFn()),
      invalidatePattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    prisma = module.get(PrismaService);
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should successfully create post, award points and invalidate cache', async () => {
      const mockPost = { id: 1, title: 'My Post', content: 'Delicious Pho' };
      prisma.post.create.mockResolvedValue(mockPost as any);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        points: 0,
        level: 1,
      } as any);
      prisma.user.update.mockResolvedValue({
        id: 1,
        points: 50,
        level: 1,
      } as any);

      const result = await service.createPost(1, {
        title: 'My Post',
        content: 'Delicious Pho',
      });

      expect(result).toEqual(mockPost);
      expect(prisma.post.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('posts:*');
    });
  });

  describe('deleteComment', () => {
    it('should throw NotFoundException if comment does not exist', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.deleteComment(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not author or commenter', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        post: { authorId: 3 },
      } as any);

      await expect(service.deleteComment(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should successfully delete comment and invalidate cache', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        post: { authorId: 3 },
      } as any);
      prisma.comment.delete.mockResolvedValue({ id: 1 } as any);

      const result = await service.deleteComment(1, 1);
      expect(result.success).toBe(true);
      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('posts:*');
    });
  });
});
