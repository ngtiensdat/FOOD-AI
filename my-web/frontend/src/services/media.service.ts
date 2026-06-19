/**
 * @fileoverview frontend/src/services/media.service.ts
 * @description Service gọi API upload và xóa ảnh lên Cloudinary thông qua Backend.
 */

import { apiClient } from '@/lib/api-client';

export const mediaService = {
  /**
   * Upload ảnh đại diện (avatar). Trả về URL Cloudinary.
   */
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.postForm<{ url: string }>('/media/avatar', formData);
    return res.url;
  },

  /**
   * Upload ảnh bìa (cover). Trả về URL Cloudinary.
   */
  async uploadCover(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.postForm<{ url: string }>('/media/cover', formData);
    return res.url;
  },

  /**
   * Upload ảnh bài đăng. Trả về URL Cloudinary.
   */
  async uploadPostImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.postForm<{ url: string }>('/media/post-image', formData);
    return res.url;
  },

  /**
   * Upload nhiều ảnh bài đăng (tối đa 5) cùng lúc. Trả về mảng URL Cloudinary.
   */
  async uploadPostImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await apiClient.postForm<{ urls: string[] }>('/media/post-images', formData);
    return res.urls;
  },

  /**
   * Xóa ảnh từ Cloudinary bằng publicId.
   */
  async deleteImage(publicId: string): Promise<{ success: boolean }> {
    return apiClient.delete('/media', { body: { publicId } }) as Promise<{ success: boolean }>;
  },
};
