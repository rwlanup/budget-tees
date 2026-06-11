'use client';

import Link from 'next/link';
import { SectionHeading } from './section-heading';
import { StorefrontContainer } from './storefront-container';
import { usePublicBrands } from '@/modules/brand/queries';

export function BrandStrip() {
  const { data: brands } = usePublicBrands();
  if (!brands || brands.length === 0) return null;

  return (
    <StorefrontContainer className="py-10">
      <SectionHeading title="Brands" />
      <div className="flex flex-wrap gap-2">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/shop?brandId=${b.id}`}
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent"
          >
            {b.name}
          </Link>
        ))}
      </div>
    </StorefrontContainer>
  );
}
