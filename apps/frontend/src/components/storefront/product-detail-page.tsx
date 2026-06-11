'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PackageX } from 'lucide-react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { ProductDetailView } from '@/components/storefront/product-detail-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ApiError } from '@/lib/api/client';
import { useProductDetail } from '@/modules/catalog/queries';

function ProductInner({ slug }: { slug: string }) {
  const sku = useSearchParams().get('sku') ?? undefined;
  const { data, isLoading, isError, error } = useProductDetail(slug);

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-48" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof ApiError && error.statusCode === 404;
    return (
      <EmptyState
        icon={PackageX}
        title={notFound ? 'Product not found' : 'Couldn’t load product'}
        description={notFound ? 'This product may no longer be available.' : 'Please try again.'}
        action={
          <Button asChild>
            <Link href="/shop">Back to shop</Link>
          </Button>
        }
      />
    );
  }

  return <ProductDetailView detail={data} initialSkuId={sku} />;
}

export function ProductDetailPage({ slug }: { slug: string }) {
  return (
    <StorefrontContainer className="py-8">
      <Suspense fallback={null}>
        <ProductInner slug={slug} />
      </Suspense>
    </StorefrontContainer>
  );
}
