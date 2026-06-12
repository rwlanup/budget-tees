'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeading } from './section-heading';
import { StorefrontContainer } from './storefront-container';
import { useCategoryTree } from '@/modules/category/queries';

export function CategoryTiles() {
  const { data, isLoading } = useCategoryTree();
  const roots = (data ?? []).filter((c) => c.isActive).slice(0, 8);

  if (!isLoading && roots.length === 0) return null;

  return (
    <StorefrontContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Browse"
        title="Shop by category"
        href="/shop"
        linkLabel="All products"
      />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {roots.map((c) => {
            const src = c.image
              ? (c.image.variants.find((v) => v.variant === 'MEDIUM')?.url ?? c.image.url)
              : null;
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="press group relative flex h-96 items-end overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/15 hover:shadow-lg"
              >
                {src ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent"
                      aria-hidden
                    />
                    <span className="relative font-heading text-base font-bold tracking-tight text-white">
                      {c.name}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="bg-aurora absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden
                    />
                    {/* No image → the title itself becomes the visual, oversized and faded. */}
                    <span
                      className="pointer-events-none absolute -bottom-3 right-0 select-none font-heading text-5xl font-extrabold leading-none tracking-tight text-foreground/6 transition-colors duration-300 group-hover:text-brand/15"
                      aria-hidden
                    >
                      {c.name}
                    </span>
                    <span className="relative font-heading text-base font-bold tracking-tight transition-colors group-hover:text-brand">
                      {c.name}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </StorefrontContainer>
  );
}
