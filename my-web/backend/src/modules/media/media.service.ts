/**
 * @fileoverview backend/src/modules/media/media.service.ts
 * @description Service upload và xóa ảnh trên Cloudinary.
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { appConfig } from '../../config/app.config';
import * as streamifier from 'streamifier';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor() {
    const config = appConfig();
    cloudinary.config({
      cloud_name: config.cloudinaryCloudName,
      api_key: config.cloudinaryApiKey,
      api_secret: config.cloudinaryApiSecret,
    });
    this.logger.log('Cloudinary configured successfully for MediaService.');
  }

  /**
   * Upload buffer (từ Multer memory storage) lên Cloudinary
   * @param buffer  - File buffer từ Express.Multer.File
   * @param folder  - Thư mục Cloudinary (vd: 'avatars', 'posts', 'covers')
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string = 'avatars',
  ): Promise<string> {
    const transformation =
      folder === 'covers'
        ? [
            { width: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ]
        : [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ];

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(
              new BadRequestException('Upload ảnh thất bại. Vui lòng thử lại.'),
            );
          }
          resolve(result.secure_url);
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload ảnh cho bài đăng - giữ nguyên tỉ lệ khung hình, giới hạn kích thước tối đa 1200px
   * @param buffer  - File buffer từ Express.Multer.File
   * @param folder  - Thư mục Cloudinary (mặc định: 'posts')
   */
  async uploadPostBuffer(
    buffer: Buffer,
    folder: string = 'posts',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('Cloudinary post image upload failed', error);
            return reject(
              new BadRequestException(
                'Upload ảnh bài đăng thất bại. Vui lòng thử lại.',
              ),
            );
          }
          resolve(result.secure_url);
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Xóa ảnh từ Cloudinary theo public_id
   * @param publicId - Public ID của ảnh trên Cloudinary (vd: 'avatars/abcdef')
   */
  async deleteImage(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error(
            `Failed to delete image with publicId: ${publicId}`,
            error,
          );
          return reject(new BadRequestException('Xóa ảnh thất bại.'));
        }
        this.logger.log(
          `Deleted image from Cloudinary: ${publicId}, result: ${JSON.stringify(result)}`,
        );
        resolve(result);
      });
    });
  }
}
