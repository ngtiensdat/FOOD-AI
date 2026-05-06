export abstract class BaseController<T> {
  abstract getAll(): Promise<any>;
  abstract getById(id: string): Promise<any>;
  abstract create(body: any): Promise<any>;
  abstract update(id: string, body: any): Promise<any>;
  abstract delete(id: string): Promise<any>;
}
