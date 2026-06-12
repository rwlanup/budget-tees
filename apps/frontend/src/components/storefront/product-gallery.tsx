'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ProductImage } from './product-image';

export interface GalleryImage {
  url: string;
  alt: string | null;
}

/**
 * PDP gallery. Main image follows the selected variant (`featuredUrl`) when set,
 * otherwise the chosen thumbnail. Thumbnails come from the product gallery.
 */
export function ProductGallery({
  images,
  featuredUrl,
  productName,
}: {
  images: GalleryImage[];
  featuredUrl: string | null;
  productName: string;
}) {
  const [active, setActive] = React.useState<string | null>(featuredUrl ?? images[0]?.url ?? null);

  React.useEffect(() => {
    if (featuredUrl) setActive(featuredUrl);
  }, [featuredUrl]);

  const mainUrl = active ?? featuredUrl ?? images[0]?.url ?? null;

  const uniqueImages = images
    .filter((img) => img.url !== featuredUrl)
    .reduce((acc, img) => {
      if (!acc.some((i) => i.url === img.url)) {
        acc.push(img);
      }
      return acc;
    }, [] as GalleryImage[]);

  return (
    <div className="space-y-3">
      <ProductImage
        src={mainUrl}
        alt={productName}
        className="w-full overflow-hidden rounded-2xl border shadow-sm"
      />
      {uniqueImages.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {uniqueImages.map((img) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(img.url)}
              aria-label="View image"
              className={cn(
                'press overflow-hidden rounded-xl border transition-all',
                mainUrl === img.url
                  ? 'ring-2 ring-brand ring-offset-2 ring-offset-background'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              <ProductImage src={img.url} alt={img.alt ?? productName} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
