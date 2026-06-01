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
  address?: string;
  mapUrl?: string;
  lat?: number | null;
  lng?: number | null;
  categoryId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFoodItem extends Food {
  restaurant?: {
    id: number;
    name: string;
  } | null;
}

export interface CreateFoodInput {
  name: string;
  price: number;
  description?: string;
  image?: string;
  tags?: string[];
  restaurantId?: number | null;
}

export interface UpdateFoodInput extends Partial<CreateFoodInput> {
  isActive?: boolean;
  isFeaturedToday?: boolean;
  isFeaturedWeekly?: boolean;
  isAdminRecommended?: boolean;
}

export interface CreateBulkFoodsInput {
  restaurantId: number;
  foods: {
    name: string;
    price: number;
    description?: string;
    image?: string;
    categoryId?: number;
    tags?: string[];
  }[];
}
