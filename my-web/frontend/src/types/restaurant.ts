import { Food } from './food';

export interface RestaurantProfile {
  logo?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  openingHours?: string | null;
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string | null;
  district?: string | null;
  mapUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  profile?: RestaurantProfile | null;
  foods?: Food[];
  _count?: {
    followers: number;
  };
  isActive?: boolean;
}

export interface UpdateRestaurantInput {
  name?: string;
  address?: string;
  city?: string;
  district?: string;
  description?: string;
  mapUrl?: string;
  logo?: string | null;
  coverImage?: string | null;
  bio?: string;
  contactEmail?: string;
  contactPhone?: string;
  openingHours?: string;
  syncWithPersonalAvatar?: boolean;
  syncWithPersonalCover?: boolean;
}
