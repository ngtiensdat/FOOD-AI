/**
 * @fileoverview backend/src/modules/media/media.controller.ts
 * @description Controller xử lý các endpoint upload và xóa media trên Cloudinary.
 */

import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * POST /media/avatar
   * Upload ảnh đại diện (avatar). Kích thước tối đa 5MB.
   */
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Chỉ chấp nhận file ảnh (image/*)'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để upload.');
    }
    const url = await this.mediaService.uploadBuffer(file.buffer, 'avatars');
    return { url };
  }

  /**
   * POST /media/cover
   * Upload ảnh bìa. Kích thước tối đa 10MB.
   */
  @Post('cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Chỉ chấp nhận file ảnh (image/*)'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadCover(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để upload.');
    }
    const url = await this.mediaService.uploadBuffer(file.buffer, 'covers');
    return { url };
  }

  /**
   * POST /media/post-image
   * Upload một ảnh đơn cho bài đăng. Kích thước tối đa 8MB.
   */
  @Post('post-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Chỉ chấp nhận file ảnh (image/*)'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadPostImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để upload.');
    }
    const url = await this.mediaService.uploadPostBuffer(file.buffer, 'posts');
    return { url };
  }

  /**
   * POST /media/post-images
   * Upload tối đa 5 ảnh cùng lúc cho bài đăng. Mỗi ảnh tối đa 8MB.
   */
  @Post('post-images')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 }, // 8MB mỗi file
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Chỉ chấp nhận file ảnh (image/*)'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadPostImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một file ảnh.');
    }
    if (files.length > 5) {
      throw new BadRequestException('Tối đa 5 ảnh mỗi bài đăng.');
    }

    const urls = await Promise.all(
      files.map((file) =>
        this.mediaService.uploadPostBuffer(file.buffer, 'posts'),
      ),
    );
    return { urls };
  }

  /**
   * DELETE /media
   * Xóa ảnh khỏi Cloudinary theo public_id.
   */
  @Delete()
  async deleteImage(
    @Body('publicId') publicId: string,
  ): Promise<{ success: boolean }> {
    if (!publicId) {
      throw new BadRequestException('publicId là bắt buộc.');
    }
    await this.mediaService.deleteImage(publicId);
    return { success: true };
  }
}
