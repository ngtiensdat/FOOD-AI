// Mục đích: Khai báo các giao diện (Interfaces) và kiểu liệt kê (Enums) đại diện cho người dùng và thông tin cá nhân.
// Ý nghĩa: Định nghĩa hệ thống kiểu dữ liệu tĩnh tập trung cho phân hệ người dùng, đảm bảo an toàn kiểu (Type Safety) trên toàn dự án.
// Chức năng đặc biệt: Cung cấp cấu trúc dữ liệu cho quá trình đăng nhập, đăng ký, thay đổi mật khẩu và lưu trữ khảo sát sở thích (onboarding).
// Design Pattern: Data Transfer Object (DTO) interfaces, Enum declaration.
// Biến, hàm đặc biệt: UserRole, UserStatus, User, UserProfile, UpdateProfileData.
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT = 'RESTAURANT',
  ADMIN = 'ADMIN',
}

export const isAdmin = (user?: { role?: UserRole | string } | null): boolean => user?.role === UserRole.ADMIN;
export const isRestaurant = (user?: { role?: UserRole | string } | null): boolean => user?.role === UserRole.RESTAURANT;
export const isCustomer = (user?: { role?: UserRole | string } | null): boolean => user?.role === UserRole.CUSTOMER;

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
  preferences?: Record<string, unknown>;
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
  createdAt?: string;
  legalDocs?: string;
  points?: number;
  xp?: number;
  level?: number;
  highestLevel?: number;
  badgeTitle?: string | null;
  _count?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
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
  preferences?: Record<string, unknown>;
}

export interface OnboardingData {
  userId?: number;
  preferences: Record<string, unknown>;
  branches?: {
    name: string;
    address: string;
    latitude: number | string;
    longitude: number | string;
    mapUrl: string;
    bio: string;
    openingHours: string;
  }[];
}

export interface LoginCredentials {
  email?: string;
  password?: string;
  [key: string]: unknown;
}

export interface RegisterData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  legalDocuments?: string;
  [key: string]: unknown;
}

export interface ChangePasswordData {
  oldPassword?: string;
  newPassword?: string;
  [key: string]: unknown;
}
