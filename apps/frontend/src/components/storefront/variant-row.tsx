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
  eyebrow,
  href,
  params,
  onlyOnSale = false,
  max = 8,
}: {
  title: string;
  eyebrow?: string;
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
    <StorefrontContainer className="py-14 sm:py-20">
      <SectionHeading title={title} eyebrow={eyebrow} href={href} />
      <VariantGrid variants={items} isLoading={isLoading} skeletonCount={max} />
    </StorefrontContainer>
  );
}
