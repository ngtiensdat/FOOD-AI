export abstract class BaseController<T> {
  abstract getAll(): Promise<T[] | { data: T[]; total: number }>;
  abstract getById(id: string): Promise<T | null>;
  abstract create(body: unknown): Promise<T>;
  abstract update(id: string, body: unknown): Promise<T>;
  abstract delete(id: string): Promise<T | { success: boolean }>;
}
