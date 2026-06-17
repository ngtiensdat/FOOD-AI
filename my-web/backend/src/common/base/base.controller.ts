// Mục đích: Định nghĩa class cha (Base) cho các Controller, quy định các API chung (CRUD).
// Ý nghĩa: Các controller khác kế thừa file này để đảm bảo tính đồng nhất của API.
// Chức năng đặc biệt: Ràng buộc phải có các phương thức getAll, getById, create, update, delete.
// Kiến thức/Design Pattern: Kế thừa (Inheritance) và Trừu tượng (Abstraction) trong OOP, Liskov Substitution Principle (SOLID).
// Biến/hàm đặc biệt: Sử dụng Generics <T> để có thể áp dụng cho mọi kiểu dữ liệu entity.
export abstract class BaseController<T> {
  abstract getAll(): Promise<T[] | { data: T[]; total: number }>;
  abstract getById(id: string): Promise<T | null>;
  abstract create(body: unknown): Promise<T>;
  abstract update(id: string, body: unknown): Promise<T>;
  abstract delete(id: string): Promise<T | { success: boolean }>;
}
