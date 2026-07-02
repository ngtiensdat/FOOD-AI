jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((val) => val),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import {
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BcryptHelper } from '../../common/utils/bcrypt.helper';
import { AiService } from '../ai/ai.service';
import { RedisService } from '../../common/redis/redis.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(() => 'mock-token'),
      verify: jest.fn(),
    };

    const mockPrismaService = {
      $transaction: jest.fn((cb) => cb(mockPrismaService)),
      user: {
        update: jest.fn(),
      },
      restaurant: {
        updateMany: jest.fn(),
      },
    };

    const mockRedisService = {
      get: jest.fn(() => null),
      set: jest.fn(),
      incr: jest.fn(),
      ttl: jest.fn(),
    };

    const mockMailService = {
      sendVerificationOtpEmail: jest.fn(() => Promise.resolve()),
      sendResetPasswordOtpEmail: jest.fn(() => Promise.resolve()),
    };

    process.env.JWT_SECRET = 'mock-jwt-secret-for-unit-tests-only';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AiService, useValue: {} },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw BadRequestException if email is already taken', async () => {
      userRepository.findByEmail.mockResolvedValue({
        id: 1,
      } as unknown as Awaited<ReturnType<UserRepository['findByEmail']>>);
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register and return tokens', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test',
        password: 'hashed-password',
      };
      userRepository.create.mockResolvedValue(
        mockUser as unknown as Awaited<ReturnType<UserRepository['create']>>,
      );

      const result = await service.register({
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
      });

      expect(result.message).toBeDefined();
      expect(result.email).toBe(mockUser.email);
    });
  });

  describe('login', () => {
    it('should throw NotFoundException for invalid email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'bad@example.com', password: 'password' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: await BcryptHelper.hash('correct-password', 10),
      };
      userRepository.findByEmail.mockResolvedValue(
        mockUser as unknown as Awaited<
          ReturnType<UserRepository['findByEmail']>
        >,
      );

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
