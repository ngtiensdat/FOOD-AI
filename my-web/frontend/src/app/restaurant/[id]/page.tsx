import React from 'react';
import { Metadata } from 'next';
import RestaurantClientPage from './RestaurantClientPage';
import { LABELS } from '@/constants/labels';
import { BACKEND_URL } from '@/configs/api.config';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = BACKEND_URL;
  
  try {
    const res = await fetch(`${apiUrl}/restaurants/${id}/public`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!res.ok) {
      return {
        title: LABELS.METADATA.RESTAURANT_NOT_FOUND_TITLE,
        description: LABELS.METADATA.RESTAURANT_NOT_FOUND_DESC,
      };
    }
    
    const data = await res.json();
    // API returns data as { restaurant, isFollowing, stats } under NestJS transform interceptor or direct JSON
    // Check if result is wrapped in a standard transform payload
    const restaurant = data?.restaurant || data?.data?.restaurant;
    
    if (!restaurant) {
      return {
        title: LABELS.METADATA.RESTAURANT_NOT_FOUND_TITLE,
        description: LABELS.METADATA.RESTAURANT_NOT_FOUND_DESC,
      };
    }

    const name = restaurant.name;
    const description = restaurant.description || `${LABELS.METADATA.RESTAURANT_DEFAULT_DESC_PREFIX}${name}${LABELS.METADATA.RESTAURANT_DEFAULT_DESC_SUFFIX}`;
    const coverImage = restaurant.profile?.coverImage || '';

    return {
      title: `${name} | FOOD AI`,
      description,
      openGraph: {
        title: `${name} | FOOD AI`,
        description,
        images: coverImage ? [{ url: coverImage }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} | FOOD AI`,
        description,
        images: coverImage ? [coverImage] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for restaurant:', error);
    return {
      title: LABELS.METADATA.RESTAURANT_DETAIL_TITLE,
      description: LABELS.METADATA.RESTAURANT_DETAIL_DESC,
    };
  }
}

export default function RestaurantPage() {
  return <RestaurantClientPage />;
}
