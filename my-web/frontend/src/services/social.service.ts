import { apiClient } from '@/lib/api-client';

export const socialService = {
  async getPosts(authorId?: number) {
    return apiClient.get('/posts', {
      params: authorId ? { authorId } : undefined,
    });
  },

  async createPost(dto: {
    title?: string;
    content?: string;
    image?: string;
    rating?: number;
    postType?: string;
    restaurantId?: number;
    foodId?: number;
    isShared?: boolean;
    sharedFromId?: number;
  }) {
    return apiClient.post('/posts', dto);
  },

  async toggleLike(postId: number) {
    return apiClient.post(`/posts/${postId}/like`);
  },

  async createComment(postId: number, dto: { content: string; parentId?: number }) {
    return apiClient.post(`/posts/${postId}/comment`, dto);
  },

  async deleteComment(commentId: number) {
    return apiClient.delete(`/posts/comments/${commentId}`);
  },
};
