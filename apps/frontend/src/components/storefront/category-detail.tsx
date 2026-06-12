'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { CatalogView } from '@/components/storefront/catalog-view';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategory } from '@/modules/category/queries';

export function CategoryDetail({ slug }: { slug: string }) {
  const { data: category, isLoading } = useCategory(slug);

  return (
    <StorefrontContainer className="py-8">
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-aurora px-6 py-10 sm:px-10 sm:py-12">
        <nav
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span className="text-border" aria-hidden>
            /
          </span>
          <Link href="/shop" className="transition-colors hover:text-foreground">
            Shop
          </Link>
          {category && (
            <>
              <span className="text-border" aria-hidden>
                /
              </span>
              <span className="font-medium text-foreground">{category.name}</span>
            </>
          )}
        </nav>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              Category
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">{category?.name ?? 'Category'}</h1>
            {category?.description && (
              <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">
                {category.description}
              </p>
            )}
          </div>
        )}
      </div>

      {category && (
        <Suspense fallback={null}>
          <CatalogView base={{ categoryId: category.id }} />
        </Suspense>
      )}
    </StorefrontContainer>
  );
}
