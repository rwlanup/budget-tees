'use client';

import { SectionHeading } from './section-heading';
import { StorefrontContainer } from './storefront-container';
import { VariantGrid } from './variant-grid';
import { useVariants } from '@/modules/catalog/queries';
import type { VariantListParams } from '@/modules/catalog/types';

/**
 * Homepage product row. Fetches variants and shows up to `max`. `onlyOnSale`
 * filters the fetched batch client-side (no server onSale filter). Hidden if empty.
 */
export function VariantRow({
  title,
  href,
  params,
  onlyOnSale = false,
  max = 8,
}: {
  title: string;
  href?: string;
  params: VariantListParams;
  onlyOnSale?: boolean;
  max?: number;
}) {
  const { data, isLoading } = useVariants(params);
  let items = data?.items ?? [];
  if (onlyOnSale) items = items.filter((v) => v.onSale);
  items = items.slice(0, max);

  if (!isLoading && items.length === 0) return null;

  return (
    <StorefrontContainer className="py-10">
      <SectionHeading title={title} href={href} />
      <VariantGrid variants={items} isLoading={isLoading} skeletonCount={max} />
    </StorefrontContainer>
  );
}
