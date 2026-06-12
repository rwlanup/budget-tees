'use client';

import Link from 'next/link';
import { SectionHeading } from './section-heading';
import { StorefrontContainer } from './storefront-container';
import { usePublicBrands } from '@/modules/brand/queries';

export function BrandStrip() {
  const { data: brands } = usePublicBrands();
  if (!brands || brands.length === 0) return null;

  return (
    <StorefrontContainer className="py-14 sm:py-20">
      <SectionHeading eyebrow="Shop the labels" title="Brands" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {brands.map((b) => {
          const src = b.logo
            ? (b.logo.variants.find((v) => v.variant === 'MEDIUM')?.url ?? b.logo.url)
            : null;
          return (
            <Link
              key={b.id}
              href={`/shop?brandId=${b.id}`}
              aria-label={b.name}
              className="press group relative flex h-24 items-center justify-center overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={b.name}
                  loading="lazy"
                  className="max-h-12 w-auto max-w-full object-contain opacity-80 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                />
              ) : (
                <>
                  {/* No logo → the brand name itself is the visual, oversized + faded. */}
                  <span
                    className="pointer-events-none absolute inset-0 flex select-none items-center justify-center px-2 text-center font-heading text-2xl font-extrabold leading-none tracking-tight text-foreground/7 transition-colors duration-300 group-hover:text-brand/15"
                    aria-hidden
                  >
                    {b.name}
                  </span>
                  <span className="relative text-sm font-semibold text-muted-foreground transition-colors group-hover:text-brand">
                    {b.name}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </StorefrontContainer>
  );
}
