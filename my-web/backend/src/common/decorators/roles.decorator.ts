// Mục đích: Định nghĩa Custom Decorator @Roles() để gắn metadata phân quyền cho các API.
// Ý nghĩa: Đánh dấu API nào cần Role gì (ví dụ @Roles(UserRole.ADMIN)) để RolesGuard dựa vào đó mà chặn/cho phép.
// Chức năng đặc biệt: Gắn mảng các roles vào metadata của class hoặc method thông qua SetMetadata.
// Kiến thức/Design Pattern: Decorator Pattern, Metadata Reflection.
// Biến/hàm đặc biệt: ROLES_KEY (khóa metadata) và hàm Roles().
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
