// Mục đích file này để làm gì: Cung cấp lớp đối tượng ApiClient gói các HTTP requests tương tác với Backend.
// Các file khác hay file này có ý nghĩa như nào: Được import và sử dụng bởi tất cả các service của frontend (auth, food, ai, category...) để gọi API.
// Các chức năng đặc biệt: Tự động trích xuất ngôn ngữ hiện tại từ localStorage để gửi header Accept-Language, quản lý cơ chế tự động refresh token khi gặp lỗi 401.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Singleton Pattern, Request Interceptor Pattern, Promise Memoization.
// Các biến, hàm đặc biệt trong file: ApiClient, apiClient instance, request.

const API_URL = '/api';

const isDev = process.env.NODE_ENV !== 'production';

const logDev = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args);
  }
};

const errorDev = (...args: unknown[]) => {
  if (isDev) {
    console.error(...args);
  }
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(method: HttpMethod, endpoint: string, options: RequestOptions = {}) {
    const fullPath = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = fullPath.startsWith('http') ? new URL(fullPath) : new URL(fullPath, baseOrigin);

    if (options.params) {
      Object.keys(options.params).forEach(key => {
        if (options.params![key] !== undefined && options.params![key] !== null) {
          url.searchParams.append(key, options.params![key].toString());
        }
      });
    }

    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = { ...options.headers } as Record<string, string>;

    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang');
      if (savedLang) {
        headers['Accept-Language'] = savedLang;
      }
    }

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const { body, params, ...restOptions } = options;
    const config: RequestInit = {
      method,
      headers,
      credentials: 'include',
      ...restOptions,
    };

    if (body && method !== 'GET') {
      config.body = isFormData ? (body as FormData) : JSON.stringify(body);
      if (!isFormData) {
        logDev(`[ApiClient] ${method} ${endpoint} Payload:`, body);
      }
    }

    try {
      logDev(`[ApiClient] Fetching: ${method} ${url.toString()}`);
      let response = await fetch(url.toString(), config);
      logDev(`[ApiClient] Response Status: ${response.status} for ${method} ${endpoint}`);

      // Xử lý Refresh Token tự động nếu nhận lỗi 401
      if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
        if (!this.refreshPromise) {
          this.refreshPromise = fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
          })
            .then((res) => res.ok)
            .catch((error) => {
              errorDev('Refresh token error:', error);
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
            return new Promise(() => { });
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        errorDev(`[ApiClient] Request failed for ${endpoint}:`, errorData);

        errorDev("Request failed details", {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          errorData,
          message: errorData?.message,
          errors: errorData?.errors
        });

        // Lấy message từ mảng errors của Backend
        let errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      logDev(`[ApiClient] Result for ${endpoint}:`, JSON.stringify(result).substring(0, 200) + '...');

      // Tự động unwrap nếu data có cấu trúc { data, ... } và không phải lỗi (errors)
      if (result && typeof result === 'object' && 'data' in result && !('errors' in result)) {
        return result.data;
      }

      return result;
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string; response?: { data?: unknown }; status?: string | number };
      errorDev("Request failed", {
        endpoint,
        error,
        message: err?.message,
        stack: err?.stack,
        response: err?.response?.data || err?.message,
        status: err?.status || 'network_error'
      });
      throw error;
    }
  }

  async get(endpoint: string, options?: RequestOptions) {
    return this.request('GET', endpoint, options);
  }

  async post(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request('POST', endpoint, { ...options, body });
  }

  async put(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request('PUT', endpoint, { ...options, body });
  }

  async patch(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request('PATCH', endpoint, { ...options, body });
  }

  async delete(endpoint: string, options?: RequestOptions) {
    return this.request('DELETE', endpoint, options);
  }

  /**
   * POST multipart/form-data (dùng cho file upload). Body phải là FormData.
   */
  async postForm<T = unknown>(endpoint: string, formData: FormData): Promise<T> {
    return this.request('POST', endpoint, { body: formData }) as Promise<T>;
  }
}

export const apiClient = new ApiClient(API_URL);
