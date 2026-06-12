'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { VariantSelector } from '@/components/storefront/variant-selector';
import { useProductDetail } from '@/modules/catalog/queries';
import type { StorefrontProductDetail } from '@/modules/catalog/types';

function axisOfValue(detail: StorefrontProductDetail, valueId: string): string | null {
  for (const ax of detail.axes) if (ax.values.some((v) => v.id === valueId)) return ax.attributeId;
  return null;
}

/** Pre-select the order item's current SKU so the customer changes from a known starting point. */
function seedSelection(
  detail: StorefrontProductDetail,
  currentSkuId: string,
): Record<string, string> {
  if (!detail.axes.length) return {};
  const target = detail.variants.find((v) => v.skuId === currentSkuId) ?? detail.variants[0];
  if (!target) return {};
  const sel: Record<string, string> = {};
  for (const valueId of target.attributeValueIds) {
    const axisId = axisOfValue(detail, valueId);
    if (axisId) sel[axisId] = valueId;
  }
  return sel;
}

/**
 * Lets a customer pick a replacement SKU of the same product for an EXCHANGE.
 * Emits the chosen skuId via onChange (null until a valid, different, in-stock SKU is picked).
 */
export function ExchangeVariantPicker({
  productId,
  currentSkuId,
  onChange,
}: {
  productId: string;
  currentSkuId: string;
  onChange: (skuId: string | null) => void;
}) {
  const { data: detail, isLoading, isError } = useProductDetail(productId);
  const [selected, setSelected] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (detail) setSelected(seedSelection(detail, currentSkuId));
  }, [detail, currentSkuId]);

  const axes = detail?.axes ?? [];
  const variants = detail?.variants ?? [];
  const fullySelected = axes.every((ax) => selected[ax.attributeId]);
  const activeVariant = !detail
    ? null
    : !axes.length
      ? (variants[0] ?? null)
      : fullySelected
        ? (variants.find((v) =>
            axes.every((ax) => v.attributeValueIds.includes(selected[ax.attributeId])),
          ) ?? null)
        : null;

  const isCurrent = activeVariant?.skuId === currentSkuId;
  const outOfStock = !!activeVariant && !activeVariant.inStock;
  const valid = !!activeVariant && !isCurrent && !outOfStock;

  React.useEffect(() => {
    onChange(valid && activeVariant ? activeVariant.skuId : null);
  }, [valid, activeVariant, onChange]);

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading variants…
      </p>
    );
  }
  if (isError || !detail) {
    return <p className="text-sm text-destructive">Couldn’t load replacement options.</p>;
  }

  return (
    <div className="space-y-2">
      <VariantSelector
        axes={axes}
        variants={variants}
        selected={selected}
        onSelect={(attributeId, valueId) =>
          setSelected((prev) => ({ ...prev, [attributeId]: valueId }))
        }
      />
      {isCurrent && (
        <p className="text-xs text-warning">Pick a variant different from the one you ordered.</p>
      )}
      {outOfStock && !isCurrent && (
        <p className="text-xs text-destructive">That variant is out of stock.</p>
      )}
      {!fullySelected && axes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Select every option to choose a replacement.
        </p>
      )}
    </div>
  );
}
