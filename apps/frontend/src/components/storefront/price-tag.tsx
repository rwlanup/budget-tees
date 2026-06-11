'use client';

import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useStoreConfig } from '@/lib/storefront/use-store-config';

interface PriceTagProps {
  price: number;
  salePrice: number;
  compareAtPrice?: number | null;
  onSale: boolean;
  discountPct?: number;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

/**
 * Price display with sale + compare-at handling. Money is server-computed; this
 * only formats. Effective price = salePrice when on sale, else list price.
 */
export function PriceTag({
  price,
  salePrice,
  compareAtPrice,
  onSale,
  discountPct = 0,
  size = 'md',
  showBadge = true,
  className,
}: PriceTagProps) {
  const { currency } = useStoreConfig();
  const effective = onSale ? salePrice : price;
  // Struck reference: the pre-sale price when on sale, else a higher MSRP if set.
  const struck = onSale ? price : compareAtPrice && compareAtPrice > price ? compareAtPrice : null;

  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <span className={cn('font-semibold tabular-nums', sizeClass, onSale && 'text-success')}>
        {formatCurrency(effective, currency)}
      </span>
      {struck != null && (
        <span className="text-sm text-muted-foreground line-through tabular-nums">
          {formatCurrency(struck, currency)}
        </span>
      )}
      {showBadge && onSale && discountPct > 0 && (
        <Badge className="bg-success text-success-foreground hover:bg-success">
          −{discountPct}%
        </Badge>
      )}
    </div>
  );
}
