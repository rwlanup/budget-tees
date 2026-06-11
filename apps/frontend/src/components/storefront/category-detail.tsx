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
      <nav className="mb-3 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="px-1">/</span>
        <Link href="/shop" className="hover:text-foreground">
          Shop
        </Link>
        {category && (
          <>
            <span className="px-1">/</span>
            <span className="text-foreground">{category.name}</span>
          </>
        )}
      </nav>

      {isLoading ? (
        <Skeleton className="mb-6 h-8 w-48" />
      ) : (
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold">{category?.name ?? 'Category'}</h1>
          {category?.description && (
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
      )}

      {category && (
        <Suspense fallback={null}>
          <CatalogView base={{ categoryId: category.id }} />
        </Suspense>
      )}
    </StorefrontContainer>
  );
}
