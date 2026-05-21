import React from 'react';
import Image from 'next/image';
import { getValidImageUrl } from '@/utils/helpers';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number; // Size in pixels
  className?: string; // Additional classes for the container
  imageClassName?: string; // Additional classes for the next/image
  fallbackClassName?: string; // Additional classes for the fallback text
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 40,
  className = '',
  imageClassName = '',
  fallbackClassName = '',
  onClick,
}) => {
  const displaySize = `${size}px`;
  const hasRoundedClass = className.includes('rounded');
  
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden flex items-center justify-center shrink-0 ${hasRoundedClass ? '' : 'rounded-full'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: displaySize, height: displaySize }}
    >
      {src ? (
        <Image
          src={getValidImageUrl(src)}
          alt={name || 'Avatar'}
          fill
          sizes={displaySize}
          className={`object-cover ${imageClassName}`}
        />
      ) : (
        <div className={`w-full h-full gradient-bg flex items-center justify-center text-white font-bold ${fallbackClassName}`}>
          {(name || 'U').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};
