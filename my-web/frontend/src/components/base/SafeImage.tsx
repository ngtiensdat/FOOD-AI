"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

const WHITELISTED_DOMAINS = [
  "res.cloudinary.com",
  "images.unsplash.com",
  "lh3.googleusercontent.com",
  "cafefcdn.com",
];

const isWhitelisted = (src: any): boolean => {
  if (typeof src !== "string") return false;
  if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) {
    return true;
  }
  try {
    const url = new URL(src);
    return WHITELISTED_DOMAINS.includes(url.hostname);
  } catch {
    return false;
  }
};

export interface SafeImageProps extends Omit<ImageProps, "src"> {
  src?: string | null | any;
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = "image",
  fill,
  width,
  height,
  className,
  style,
  fallbackSrc = "/placeholder-food.svg",
  priority,
  onError,
  ...props
}) => {
  // Use fallback if src is null, undefined, or empty
  const initialSrc = src || fallbackSrc;
  const [imgSrc, setImgSrc] = useState<string>(initialSrc);

  // Sync state if src or fallbackSrc changes
  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    if (onError) {
      onError(e);
    }
  };

  // Check if domain is whitelisted
  const useNextImage = isWhitelisted(imgSrc);

  if (useNextImage) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        style={style}
        priority={priority}
        onError={handleError}
        {...props}
      />
    );
  }

  // Fallback to standard <img> for non-whitelisted domains to prevent Next.js image crash
  const imgStyle: React.CSSProperties | undefined = fill
    ? {
      position: "absolute",
      height: "100%",
      width: "100%",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      objectFit: "cover",
      ...style,
    }
    : style;

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width ? Number(width) : undefined}
      height={height ? Number(height) : undefined}
      className={className}
      style={imgStyle}
      loading={priority ? "eager" : "lazy"}
      onError={handleError}
      {...(props as any)}
    />
  );
};

export default SafeImage;
