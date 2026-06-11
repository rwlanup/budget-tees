import { Suspense } from 'react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { CatalogView } from '@/components/storefront/catalog-view';

export const metadata = {
  title: 'Shop',
  description: 'Browse the full Budget Tees catalogue — quality tees and apparel that fit your budget.',
};

export default function ShopPage() {
  return (
    <StorefrontContainer className="py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Shop all</h1>
      <Suspense fallback={null}>
        <CatalogView />
      </Suspense>
    </StorefrontContainer>
  );
}
