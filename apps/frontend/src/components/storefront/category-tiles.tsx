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
    <StorefrontContainer className="py-10">
      <SectionHeading title="Shop by category" href="/shop" linkLabel="All products" />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {roots.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="flex items-center justify-center rounded-lg border bg-card p-6 text-center text-sm font-medium transition-colors hover:bg-accent"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </StorefrontContainer>
  );
}
