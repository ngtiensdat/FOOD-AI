import React from 'react';
import { Metadata } from 'next';
import RestaurantClientPage from './RestaurantClientPage';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${apiUrl}/restaurants/${id}/public`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!res.ok) {
      return {
        title: 'Không tìm thấy nhà hàng | FOOD AI',
        description: 'Không tìm thấy thông tin nhà hàng yêu cầu.',
      };
    }
    
    const data = await res.json();
    // API returns data as { restaurant, isFollowing, stats } under NestJS transform interceptor or direct JSON
    // Check if result is wrapped in a standard transform payload
    const restaurant = data?.restaurant || data?.data?.restaurant;
    
    if (!restaurant) {
      return {
        title: 'Không tìm thấy nhà hàng | FOOD AI',
        description: 'Không tìm thấy thông tin nhà hàng yêu cầu.',
      };
    }

    const name = restaurant.name;
    const description = restaurant.description || `Khám phá các món ăn ngon tại ${name} trên FOOD AI.`;
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
      title: 'Chi tiết nhà hàng | FOOD AI',
      description: 'Khám phá quán ăn ngon trên hệ thống FOOD AI.',
    };
  }
}

export default function RestaurantPage() {
  return <RestaurantClientPage />;
}
