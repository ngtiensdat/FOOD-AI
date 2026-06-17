export abstract class BaseService<T> {
  abstract findAll(): Promise<T[]>;
  abstract findOne(id: number): Promise<T | null>;
  abstract create(data: unknown): Promise<T>;
  abstract update(id: number, data: unknown): Promise<T>;
  abstract remove(id: number): Promise<T>;
}
