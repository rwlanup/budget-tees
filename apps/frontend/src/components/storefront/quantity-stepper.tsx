'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX = 99;

/** Quantity selector clamped to 1..max (max defaults to the cart's per-item cap). */
export function QuantityStepper({
  value,
  onChange,
  max = MAX,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  disabled?: boolean;
}) {
  const cap = Math.min(max, MAX);
  const set = (n: number) => onChange(Math.max(1, Math.min(cap, n)));

  return (
    <div className="inline-flex items-center rounded-md border">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-r-none"
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => set(value - 1)}
      >
        <Minus className="size-4" aria-hidden />
      </Button>
      <span className="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-l-none"
        aria-label="Increase quantity"
        disabled={disabled || value >= cap}
        onClick={() => set(value + 1)}
      >
        <Plus className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
