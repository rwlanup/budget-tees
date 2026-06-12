import { Suspense } from 'react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { CatalogView } from '@/components/storefront/catalog-view';

export const metadata = {
  title: 'Shop',
  description:
    'Browse the full Budget Tees catalogue — quality tees and apparel that fit your budget.',
};

export default function ShopPage() {
  return (
    <StorefrontContainer className="py-8">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Budget Tees
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">Shop all</h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">
          Quality tees and apparel that fit your budget. Filter by what you love.
        </p>
      </header>
      <Suspense fallback={null}>
        <CatalogView />
      </Suspense>
    </StorefrontContainer>
  );
}
