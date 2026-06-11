import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Storefront image. Uses a plain <img> (like the admin MediaImage) because media
 * is served from a separate origin (local /uploads or S3) — avoids next/image
 * remote-pattern config. Reserves space via aspect ratio to prevent CLS.
 */
export function ProductImage({
  src,
  alt,
  className,
  ratio = 'square',
}: {
  src: string | null;
  alt: string;
  className?: string;
  ratio?: 'square' | 'portrait';
}) {
  const aspect = ratio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square';
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-muted', aspect, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <ImageIcon className="size-8 text-muted-foreground" aria-hidden />
        </div>
      )}
    </div>
  );
}
