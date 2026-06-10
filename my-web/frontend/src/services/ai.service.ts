// Mục đích: Thực hiện các cuộc gọi API liên quan đến trí tuệ nhân tạo (AI Chat) bao gồm quản lý hội thoại, thời tiết và phản hồi (feedback).
// Ý nghĩa: Đóng vai trò là Service Layer tập trung kết nối ứng dụng với mô hình ngôn ngữ AI của backend.
// Chức năng đặc biệt: Tích hợp cơ chế chống gửi yêu cầu tạo hội thoại trùng lặp (activeCreatePromise), lấy thông tin thời tiết tự động và quản lý phản hồi hữu ích (feedback).
// Design Pattern: Service pattern, API Client encapsulation, Promise deduplication.
// Biến, hàm đặc biệt: aiService, activeCreatePromise, chat, submitFeedback, clearAllFeedback.

import { apiClient } from '@/lib/api-client';

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  messages?: unknown[];
  suggestions?: unknown[];
}

let activeCreatePromise: Promise<Conversation | null> | null = null;

export const aiService = {
  async chat(
    message: string,
    lat?: number,
    lng?: number,
    city?: string,
    district?: string,
    temperature?: number,
    isRaining?: boolean,
    conversationId?: number
  ) {
    try {
      const response = await apiClient.post('/ai/chat', {
        message,
        lat,
        lng,
        city,
        district,
        temperature,
        isRaining,
        conversationId,
      });
      return response.data || response;
    } catch {
      return { reply: '', suggestions: [] };
    }
  },

  async getConversations() {
    try {
      const response = await apiClient.get('/ai/conversations');
      return response.data || response;
    } catch {
      return [];
    }
  },

  async createConversation(): Promise<Conversation | null> {
    if (activeCreatePromise) {
      return activeCreatePromise;
    }
    activeCreatePromise = (async () => {
      try {
        const response = await apiClient.post('/ai/conversations');
        return response.data || response;
      } catch {
        return null;
      } finally {
        activeCreatePromise = null;
      }
    })();
    return activeCreatePromise;
  },

  async getConversationDetail(id: number) {
    try {
      const response = await apiClient.get(`/ai/conversations/${id}`);
      return response.data || response;
    } catch {
      return null;
    }
  },

  async deleteConversation(id: number) {
    try {
      await apiClient.delete(`/ai/conversations/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async submitFeedback(conversationId: number | null | undefined, foodId: number, feedbackType: 'LIKE' | 'DISLIKE') {
    try {
      const response = await apiClient.post('/ai/feedback', {
        conversationId: conversationId || undefined,
        foodId,
        feedbackType,
      });
      return response.data || response;
    } catch {
      return null;
    }
  },

  async getWeather(lat: number, lng: number) {
    try {
      const response = await apiClient.get('/ai/weather', { params: { lat, lng } });
      return response.data || response;
    } catch {
      return null;
    }
  },

  async getContext() {
    try {
      const response = await apiClient.get('/ai/context');
      return response.data || response;
    } catch {
      return null;
    }
  },

  async clearContext() {
    try {
      await apiClient.delete('/ai/context');
      return true;
    } catch {
      return false;
    }
  },

  async getFeedbackList() {
    try {
      const response = await apiClient.get('/ai/feedback');
      return response.data || response;
    } catch (err) {
      console.error('Error getting feedback list:', err);
      return [];
    }
  },

  async clearAllFeedback() {
    try {
      const response = await apiClient.delete('/ai/feedback');
      return response.data || response;
    } catch (err) {
      console.error('Error clearing all feedbacks:', err);
      return null;
    }
  }
};
