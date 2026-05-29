const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends Omit<RequestInit, 'method'> {
  params?: Record<string, any>;
  body?: any;
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

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

    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = { ...options.headers } as Record<string, string>;
    
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include',
      ...options,
    };

    if (options.body && method !== 'GET') {
      config.body = isFormData ? (options.body as FormData) : JSON.stringify(options.body);
      if (!isFormData) {
        console.log(`[ApiClient] ${method} ${endpoint} Payload:`, options.body);
      }
    }

    console.log(`[ApiClient] Fetching: ${method} ${url.toString()}`);
    let response = await fetch(url.toString(), config);
    console.log(`[ApiClient] Response Status: ${response.status} for ${method} ${endpoint}`);

    // Xử lý Refresh Token tự động nếu nhận lỗi 401
    if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
      if (!this.refreshPromise) {
        this.refreshPromise = fetch(`${this.baseUrl}/auth/refresh`, { 
            method: 'POST', 
            credentials: 'include' 
        })
          .then((res) => res.ok)
          .catch((error) => {
            console.error('Refresh token error:', error);
            return false;
          })
          .finally(() => {
            this.refreshPromise = null;
          });
      }

      const isRefreshed = await this.refreshPromise;
      
      if (isRefreshed) {
        response = await fetch(url.toString(), config);
      } else {
        if (typeof window !== 'undefined') {
          const { useAuthStore } = await import('@/store/useAuthStore');
          useAuthStore.getState().logout();
          window.location.href = '/login';
          // Hang the promise to prevent throwing errors while redirecting
          return new Promise(() => {});
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      console.error(`[ApiClient] Request failed for ${endpoint}:`, errorData);
      
      // Lấy message từ mảng errors của Backend
      let errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        errorMessage = errorData.errors[0].message;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[ApiClient] Result for ${endpoint}:`, JSON.stringify(result).substring(0, 200) + '...');
    
    // Tự động unwrap nếu data có cấu trúc { data, ... } và không phải lỗi (errors)
    if (result && typeof result === 'object' && 'data' in result && !('errors' in result)) {
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
