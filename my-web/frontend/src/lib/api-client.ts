const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends Omit<RequestInit, 'method'> {
  params?: Record<string, any>;
  body?: any;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(method: HttpMethod, endpoint: string, options: RequestOptions = {}) {
    const url = new URL(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
    
    if (options.params) {
      Object.keys(options.params).forEach(key => {
        if (options.params![key] !== undefined && options.params![key] !== null) {
          url.searchParams.append(key, options.params![key].toString());
        }
      });
    }

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // QUAN TRỌNG: Để trình duyệt gửi Cookie
      ...options,
    };

    if (options.body && method !== 'GET') {
      config.body = JSON.stringify(options.body);
      console.log(`[ApiClient] ${method} ${endpoint} Payload:`, options.body);
    }

    let response = await fetch(url.toString(), config);

    // Xử lý Refresh Token tự động nếu nhận lỗi 401
    if (response.status === 401 && !endpoint.includes('/auth/refresh') && !this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, { 
            method: 'POST', 
            credentials: 'include' 
        });
        
        if (refreshRes.ok) {
          response = await fetch(url.toString(), config);
        } else {
          if (typeof window !== 'undefined') {
            const { useAuthStore } = await import('@/store/useAuthStore');
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Refresh token error:', error);
      } finally {
        this.isRefreshing = false;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Tự động unwrap nếu data có cấu trúc { success, data, message }
    if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
      return result.data;
    }

    return result;
  }

  async get(endpoint: string, options?: RequestOptions) {
    return this.request('GET', endpoint, options);
  }

  async post(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request('POST', endpoint, { ...options, body });
  }

  async put(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request('PUT', endpoint, { ...options, body });
  }

  async patch(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request('PATCH', endpoint, { ...options, body });
  }

  async delete(endpoint: string, options?: RequestOptions) {
    return this.request('DELETE', endpoint, options);
  }
}

export const apiClient = new ApiClient(API_URL);
