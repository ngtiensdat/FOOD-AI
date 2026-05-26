import { UserStatus } from './user';

export interface Food {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  status: UserStatus;
  isFeaturedToday: boolean;
  isFeaturedWeekly: boolean;
  isAdminRecommended: boolean;
  isActive?: boolean;
  restaurantId?: number | null;
  restaurant?: {
    id: number;
    name: string;
  } | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminFoodItem extends Food {
  restaurant?: {
    id: number;
    name: string;
  } | null;
}
