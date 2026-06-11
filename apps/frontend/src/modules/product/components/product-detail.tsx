'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DataState } from '@/components/shared/data-state';
import { useProduct } from '../queries';
import { ProductStatusBadge } from './product-status-badge';
import { ProductGeneralTab } from './product-general-tab';
import { ProductGalleryManager } from './product-gallery-manager';
import { ProductAttributesManager } from './product-attributes-manager';
import { ProductVariantsManager } from '@/modules/sku/components/product-variants-manager';

const TABS = ['general', 'media', 'attributes', 'variants'] as const;

export function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: product, isLoading, isError, refetch } = useProduct(id);

  const urlTab = searchParams.get('tab');
  const active = urlTab && (TABS as readonly string[]).includes(urlTab) ? urlTab : 'general';

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <DataState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      loadingFallback={<Skeleton className="h-96 w-full" />}
    >
      {product && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{product.name}</h1>
            <ProductStatusBadge status={product.status} />
          </div>

          <Tabs value={active} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-6">
              <ProductGeneralTab product={product} />
            </TabsContent>
            <TabsContent value="media" className="mt-6">
              <ProductGalleryManager productId={product.id} />
            </TabsContent>
            <TabsContent value="attributes" className="mt-6">
              <ProductAttributesManager productId={product.id} />
            </TabsContent>
            <TabsContent value="variants" className="mt-6">
              <ProductVariantsManager product={product} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DataState>
  );
}
