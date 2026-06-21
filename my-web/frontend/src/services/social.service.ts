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
    images?: string[];
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

  async toggleSavePost(postId: number) {
    return apiClient.post(`/posts/${postId}/save`);
  },

  async getSavedPosts() {
    return apiClient.get('/posts/saved');
  },

  async deletePost(postId: number) {
    return apiClient.delete(`/posts/${postId}`);
  },

  async updatePost(postId: number, dto: {
    title?: string;
    content?: string;
    images?: string[];
    postType?: string;
    rating?: number | null;
    restaurantId?: number | null;
    foodId?: number | null;
  }) {
    return apiClient.patch(`/posts/${postId}`, dto);
  },

  async togglePinPost(postId: number) {
    return apiClient.post(`/posts/${postId}/pin`);
  },
};
