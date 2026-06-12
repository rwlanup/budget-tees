import { HeroSearch } from '@/components/storefront/hero-search';
import { TrustBar } from '@/components/storefront/trust-bar';
import { CategoryTiles } from '@/components/storefront/category-tiles';
import { FeaturedStrip } from '@/components/storefront/featured-strip';
import { VariantRow } from '@/components/storefront/variant-row';
import { BrandStrip } from '@/components/storefront/brand-strip';

export const metadata = {
  title: { absolute: 'Budget Tees — Quality Tees That Fit Your Budget' },
  description:
    'Shop quality t-shirts and apparel that fit your budget. Fast shipping, easy returns, and prices you’ll love.',
};

export default function HomePage() {
  return (
    <div>
      <HeroSearch />
      <TrustBar />
      <CategoryTiles />
      <FeaturedStrip />
      <VariantRow
        title="New arrivals"
        eyebrow="Just dropped"
        href="/shop"
        params={{ sort: 'newest', limit: 8 }}
      />
      <VariantRow
        title="On sale"
        eyebrow="Best value"
        href="/shop"
        params={{ sort: 'newest', limit: 24 }}
        onlyOnSale
      />
      <BrandStrip />
    </div>
  );
}
