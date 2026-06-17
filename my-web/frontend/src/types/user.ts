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
}

export interface OnboardingData {
  userId: number;
  preferences: Record<string, any>;
}
