// Mục đích: Định nghĩa bộ khung chức năng (Base) cho các Service trong hệ thống.
// Ý nghĩa: Giúp các Service kế thừa và bắt buộc triển khai đầy đủ các hàm CRUD cơ bản.
// Chức năng đặc biệt: Ràng buộc các Service phải có findAll, findOne, create, update, remove.
// Kiến thức/Design Pattern: Abstract class, Abstraction trong OOP. Đảm bảo Single Responsibility Principle.
// Biến/hàm đặc biệt: Tham số id và data sử dụng Generics <T> để tái sử dụng mã (Code reusability).
export abstract class BaseService<T> {
  abstract findAll(): Promise<T[]>;
  abstract findOne(id: number): Promise<T | null>;
  abstract create(data: unknown): Promise<T>;
  abstract update(id: number, data: unknown): Promise<T>;
  abstract remove(id: number): Promise<T>;
}
