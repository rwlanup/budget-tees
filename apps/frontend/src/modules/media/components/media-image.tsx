import { cn } from '@/lib/utils';
import { getVariantUrl } from '../lib';
import type { Media, MediaVariantType } from '../types';

interface MediaImageProps {
  media: Media;
  size?: MediaVariantType;
  className?: string;
  /** Fallback alt when the media has no altText. */
  alt?: string;
}

/**
 * Renders a media asset. Uses a plain <img> (not next/image) since the storage
 * host varies (local /uploads or S3) and we don't want to maintain remotePatterns.
 * width/height come from the variant to avoid layout shift.
 */
export function MediaImage({ media, size = 'MEDIUM', className, alt }: MediaImageProps) {
  const variant = media.variants.find((v) => v.variant === size);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getVariantUrl(media, size)}
      alt={media.altText ?? alt ?? ''}
      width={variant?.width ?? media.width ?? undefined}
      height={variant?.height ?? media.height ?? undefined}
      loading="lazy"
      decoding="async"
      className={cn('object-cover', className)}
    />
  );
}
