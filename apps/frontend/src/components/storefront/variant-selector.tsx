'use client';

import { cn } from '@/lib/utils';
import type { StorefrontAxis, StorefrontVariantDetail } from '@/modules/catalog/types';

interface Props {
  axes: StorefrontAxis[];
  variants: StorefrontVariantDetail[];
  selected: Record<string, string>;
  onSelect: (attributeId: string, valueId: string) => void;
}

/** Per-axis option buttons. Values with no matching variant (given other picks) are disabled. */
export function VariantSelector({ axes, variants, selected, onSelect }: Props) {
  // A value is available if some variant contains it AND matches every OTHER selected axis.
  const isAvailable = (attributeId: string, valueId: string) =>
    variants.some((v) => {
      if (!v.attributeValueIds.includes(valueId)) return false;
      return axes.every((ax) => {
        if (ax.attributeId === attributeId) return true;
        const sel = selected[ax.attributeId];
        return !sel || v.attributeValueIds.includes(sel);
      });
    });

  // In-stock signal per value (for styling), under current other selections.
  const hasStock = (attributeId: string, valueId: string) =>
    variants.some(
      (v) =>
        v.attributeValueIds.includes(valueId) &&
        v.inStock &&
        axes.every((ax) => {
          if (ax.attributeId === attributeId) return true;
          const sel = selected[ax.attributeId];
          return !sel || v.attributeValueIds.includes(sel);
        }),
    );

  return (
    <div className="space-y-4">
      {axes.map((axis) => (
        <div key={axis.attributeId} className="space-y-2">
          <p className="text-sm font-semibold">
            <span className="text-muted-foreground">{axis.name}:</span>
            {selected[axis.attributeId] && (
              <span className="ml-1.5 text-foreground">
                {axis.values.find((v) => v.id === selected[axis.attributeId])?.value}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {axis.values.map((val) => {
              const available = isAvailable(axis.attributeId, val.id);
              const inStock = hasStock(axis.attributeId, val.id);
              const isSelected = selected[axis.attributeId] === val.id;
              const hex =
                val.meta && typeof (val.meta as { hex?: unknown }).hex === 'string'
                  ? (val.meta as { hex: string }).hex
                  : null;
              return (
                <button
                  key={val.id}
                  type="button"
                  disabled={!available}
                  onClick={() => onSelect(axis.attributeId, val.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'press inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                    isSelected
                      ? 'border-foreground bg-foreground text-background shadow-sm'
                      : 'hover:border-foreground/30 hover:bg-accent',
                    !available && 'cursor-not-allowed opacity-40',
                    available && !inStock && !isSelected && 'text-muted-foreground',
                  )}
                >
                  {hex && (
                    <span
                      className="size-4 rounded-full border"
                      style={{ backgroundColor: hex }}
                      aria-hidden
                    />
                  )}
                  {val.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
