import { BRAND_LOGO_URL, BRAND_ICON_URL } from '@/shared/config/brand';
import type { ImgHTMLAttributes } from 'react';

interface RareMindsLogoProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'alt' | 'width' | 'height' | 'loading' | 'decoding'
  > {
  variant?: 'logo' | 'icon';
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
}

export default function RareMindsLogo({
  variant = 'logo',
  src = variant === 'icon' ? BRAND_ICON_URL : BRAND_LOGO_URL,
  alt = 'RareMinds Logo',
  priority = false,
  ...rest
}: RareMindsLogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...(priority ? { fetchpriority: 'high' } : {})}
      {...rest}
    />
  );
}
