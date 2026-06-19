// Mục đích: Định nghĩa tiện ích Circuit Breaker (Bộ ngắt mạch) để tránh lỗi cascade khi dịch vụ ngoài (OpenAI, Open-Meteo) bị sự cố.
// Ý nghĩa: Khi dịch vụ ngoài liên tiếp gặp lỗi, Circuit Breaker sẽ chuyển sang trạng thái OPEN để chặn toàn bộ request gửi đi, tránh quá tải hệ thống, và trả về giá trị fallback lập tức.
// Thiết kế: State Machine Pattern (CLOSED, OPEN, HALF_OPEN), Generic Types cho phép bọc mọi hàm Promise.

export class CircuitBreaker<TArgs extends unknown[], TReturn> {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private nextAttemptTime = 0;

  constructor(
    private readonly requestFunction: (...args: TArgs) => Promise<TReturn>,
    private readonly options: {
      failureThreshold: number; // Số lần lỗi liên tiếp để chuyển sang OPEN
      cooldownPeriodMs: number; // Thời gian chờ hồi phục để chuyển sang HALF_OPEN
      fallbackValue?:
        | TReturn
        | ((...args: TArgs) => TReturn | Promise<TReturn>); // Giá trị thay thế khi lỗi/chặn
    },
  ) {}

  async execute(...args: TArgs): Promise<TReturn> {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
      } else {
        // Trạng thái OPEN: Chặn ngay lập tức và trả về fallback (nếu có)
        if (this.options.fallbackValue !== undefined) {
          if (typeof this.options.fallbackValue === 'function') {
            return (
              this.options.fallbackValue as (
                ...args: TArgs
              ) => TReturn | Promise<TReturn>
            )(...args);
          }
          return this.options.fallbackValue;
        }
        throw new Error('Circuit Breaker is OPEN. Request blocked.');
      }
    }

    try {
      const result = await this.requestFunction(...args);

      // Trạng thái HALF_OPEN/CLOSED thành công: Khôi phục trạng thái ban đầu
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;

      // Đạt ngưỡng lỗi liên tiếp: Ngắt mạch sang OPEN
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.options.cooldownPeriodMs;
      }

      if (this.options.fallbackValue !== undefined) {
        if (typeof this.options.fallbackValue === 'function') {
          return (
            this.options.fallbackValue as (
              ...args: TArgs
            ) => TReturn | Promise<TReturn>
          )(...args);
        }
        return this.options.fallbackValue;
      }

      throw error;
    }
  }
}
