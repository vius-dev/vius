import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    fill?: boolean;
}

export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    fill = false,
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Generate blur placeholder
    const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="0%" />
          <stop stop-color="#edeef1" offset="20%" />
          <stop stop-color="#f6f7f8" offset="40%" />
          <stop stop-color="#f6f7f8" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f6f7f8" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `;

    const toBase64 = (str: string) =>
        typeof window === 'undefined'
            ? Buffer.from(str).toString('base64')
            : window.btoa(str);

    if (fill) {
        return (
            <Image
                src={src}
                alt={alt}
                fill
                className={`${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
                onLoadingComplete={() => setIsLoading(false)}
                priority={priority}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
            />
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={width || 800}
            height={height || 600}
            className={`${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
            onLoadingComplete={() => setIsLoading(false)}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(width || 800, height || 600))}`}
        />
    );
}
