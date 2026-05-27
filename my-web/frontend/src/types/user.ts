/**
 * Mục đích file này: Khai báo định nghĩa các kiểu dữ liệu (Types) và Enums liên quan đến thực thể Người dùng (User), Hồ sơ cá nhân (UserProfile) và phân quyền (Roles).
 * Các file liên quan: Được sử dụng rộng rãi trên toàn bộ frontend để phục vụ việc xác định kiểu và ép kiểu dữ liệu an toàn (Type Safety).
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT = 'RESTAURANT',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface UserProfile {
  id: number;
  userId: number;
  fullName?: string;
  phone?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  address?: string;
  workAt?: string;
  hasCompletedOnboarding: boolean;
  preferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  profile?: UserProfile;
  isFollowing?: boolean;
  hasCompletedOnboarding?: boolean;
  avatar?: string;
}

export interface UpdateProfileData {
  name?: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  address?: string;
  workAt?: string;
  syncWithRestaurantLogo?: boolean;
  syncWithRestaurantCover?: boolean;
}

export interface OnboardingData {
  userId: number;
  preferences: Record<string, any>;
}
