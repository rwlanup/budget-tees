'use client';

import * as React from 'react';
import { X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { useValidateCoupon } from '@/modules/checkout/queries';
import type { CouponPreview } from '@/modules/checkout/types';

export function CouponField({
  applied,
  onApply,
  onClear,
}: {
  applied: CouponPreview | null;
  onApply: (preview: CouponPreview) => void;
  onClear: () => void;
}) {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const validate = useValidateCoupon();

  const apply = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    validate.mutate(trimmed, {
      onSuccess: (preview) => {
        onApply(preview);
        setCode('');
      },
      onError: (err) =>
        setError(
          err instanceof ApiError
            ? ((err.details as { reason?: string })?.reason ?? err.messages[0])
            : 'Invalid coupon',
        ),
    });
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md border border-success/40 bg-success/5 px-3 py-2 text-sm">
        <span className="flex items-center gap-2">
          <Check className="size-4 text-success" aria-hidden />
          <span className="font-medium">{applied.code}</span> applied
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Remove coupon"
          onClick={onClear}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          aria-label="Coupon code"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), apply())}
        />
        <Button
          type="button"
          variant="outline"
          onClick={apply}
          disabled={validate.isPending || !code.trim()}
        >
          Apply
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
