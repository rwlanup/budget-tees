'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = { sm: 'size-3.5', md: 'size-4', lg: 'size-6' } as const;

/** Read-only star display. Supports half via rounding to nearest .5. */
export function StarRating({
  value,
  size = 'md',
  className,
}: {
  value: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i - 0.25;
        return (
          <Star
            key={i}
            className={cn(
              SIZES[size],
              filled ? 'fill-warning text-warning' : 'fill-transparent text-muted-foreground/40',
            )}
          />
        );
      })}
    </div>
  );
}

/** Interactive star input for forms. */
export function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          disabled={disabled}
          className="cursor-pointer rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          onClick={() => onChange(i)}
        >
          <Star
            className={cn(
              'size-7',
              shown >= i
                ? 'fill-warning text-warning'
                : 'fill-transparent text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}
