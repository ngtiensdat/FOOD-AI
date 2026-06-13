// Mục đích: Định nghĩa tiện ích Retry hỗ trợ trì hoãn lũy thừa (exponential backoff) để phục hồi các tác vụ bị lỗi nhất thời (như gọi API mạng, embedding, v.v.).

export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500,
  backoff = 2,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * backoff, backoff);
  }
}
