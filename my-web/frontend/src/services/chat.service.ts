import { apiClient } from '@/lib/api-client';

export interface ChatParticipant {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  isAccepted: boolean;
}

export interface LastMessage {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    name: string;
  };
}

export interface Conversation {
  id: number;
  name: string | null;
  isGroup: boolean;
  creatorId: number | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  lastMessage: LastMessage | null;
}

export interface MessageSender {
  id: number;
  name: string;
  profile?: {
    avatar: string | null;
  } | null;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: MessageSender;
}

export const chatService = {
  async getConversations(type: 'inbox' | 'requests'): Promise<Conversation[]> {
    return apiClient.get(`/chat/conversations?type=${type}`);
  },

  async getMessages(conversationId: number): Promise<ChatMessage[]> {
    return apiClient.get(`/chat/conversations/${conversationId}/messages`);
  },

  async createDirectChat(recipientId: number): Promise<any> {
    return apiClient.post('/chat/conversations', { recipientId });
  },

  async createGroupChat(name: string, participantIds: number[]): Promise<any> {
    return apiClient.post('/chat/conversations/group', { name, participantIds });
  },

  async sendMessage(conversationId: number, content: string): Promise<ChatMessage> {
    return apiClient.post(`/chat/conversations/${conversationId}/messages`, { content });
  },

  async acceptRequest(conversationId: number): Promise<any> {
    return apiClient.patch(`/chat/conversations/${conversationId}/accept`, {});
  },

  async searchUsers(query: string): Promise<ChatParticipant[]> {
    return apiClient.get(`/chat/users/search?q=${encodeURIComponent(query)}`);
  },
};
