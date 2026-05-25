import React, { useState } from 'react';
import Image from 'next/image';
import { getValidImageUrl } from '@/utils/helpers';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number; // Size in pixels
  className?: string; // Additional classes for the container
  imageClassName?: string; // Additional classes for the next/image
  fallbackClassName?: string; // Additional classes for the fallback text
  onClick?: (e: React.MouseEvent) => void;
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
  const [hasError, setHasError] = useState(false);
  const displaySize = `${size}px`;
  const hasRoundedClass = className.includes('rounded');
  const isResponsiveSize = className.includes('w-') || className.includes('h-');

  // Lọc kỹ các URL không hợp lệ trước khi quyết định hiển thị ảnh
  const hasValidImage = src && 
    src !== 'null' && 
    src !== 'undefined' && 
    src.trim() !== '' && 
    !src.includes('placeholder-food');

  // Lấy tối đa 2 chữ cái đầu tiên của tên làm Fallback (Ví dụ: "Nguyễn Tiến Đạt" -> "NT")
  const getInitials = () => {
    if (!name || name.trim() === '') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials();
  const fontSize = `${Math.round(size * 0.38)}px`;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden flex items-center justify-center shrink-0 ${hasRoundedClass ? '' : 'rounded-full'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={isResponsiveSize ? undefined : { width: displaySize, height: displaySize }}
    >
      {hasValidImage && !hasError ? (
        <Image
          src={getValidImageUrl(src)}
          alt={name || 'Avatar'}
          fill
          sizes={displaySize}
          className={`object-cover rounded-full ${imageClassName}`}
          onError={() => setHasError(true)}
        />
      ) : (
        <div 
          className={`w-full h-full gradient-bg flex items-center justify-center text-white font-bold select-none ${fallbackClassName}`}
          style={{ fontSize, lineHeight: 1 }}
        >
          {initials}
        </div>
      )}
    </div>
  );
};

