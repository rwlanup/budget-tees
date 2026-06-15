'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import { ProductReviews } from './product-reviews';
import type { StorefrontProductDetail } from '@/modules/catalog/types';

export function ProductTabs({
  detail,
  activeSku,
}: {
  detail: StorefrontProductDetail;
  activeSku: string | null;
}) {
  const { returnWindowDays } = useStoreConfig();
  const { product } = detail;

  return (
    <Tabs defaultValue="description" className="w-full">
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-max">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="shipping">Shipping &amp; returns</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="description"
        className="max-w-prose pt-4 text-sm text-muted-foreground whitespace-pre-wrap"
      >
        {product.description || product.shortDescription || 'No description available.'}
      </TabsContent>

      <TabsContent value="details" className="pt-4">
        <dl className="grid max-w-md grid-cols-[8rem_1fr] gap-y-2 text-sm">
          {product.brand && (
            <>
              <dt className="text-muted-foreground">Brand</dt>
              <dd>
                <Link
                  href={`/shop?brandId=${product.brand.id}`}
                  className="underline-offset-2 transition-colors hover:text-brand hover:underline"
                >
                  {product.brand.name}
                </Link>
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">Category</dt>
          <dd>
            <Link
              href={`/category/${product.category.slug}`}
              className="underline-offset-2 transition-colors hover:text-brand hover:underline"
            >
              {product.category.name}
            </Link>
          </dd>
          {detail.attributes.map((a) => (
            <Fragment key={a.attributeId}>
              <dt className="text-muted-foreground">{a.name}</dt>
              <dd>{a.values.map((v) => v.value).join(', ')}</dd>
            </Fragment>
          ))}
          {activeSku && (
            <>
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="font-mono text-xs">{activeSku}</dd>
            </>
          )}
          {product.tags.length > 0 && (
            <>
              <dt className="text-muted-foreground">Tags</dt>
              <dd>
                {product.tags.map((t, i) => (
                  <Fragment key={t.id}>
                    {i > 0 && ', '}
                    <Link
                      href={`/search?q=${encodeURIComponent(t.name)}`}
                      className="underline-offset-2 transition-colors hover:text-brand hover:underline"
                    >
                      {t.name}
                    </Link>
                  </Fragment>
                ))}
              </dd>
            </>
          )}
        </dl>
      </TabsContent>

      <TabsContent value="shipping" className="max-w-prose pt-4 text-sm text-muted-foreground">
        <p>Delivery across Nepal. Cash on delivery available. Charges shown at checkout.</p>
        {returnWindowDays != null && (
          <p className="mt-2">Returns accepted within {returnWindowDays} days of delivery.</p>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="pt-4">
        <ProductReviews productId={product.id} />
      </TabsContent>
    </Tabs>
  );
}
