'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { QuantityStepper } from '@/components/storefront/quantity-stepper';
import type { Order } from '@/modules/order/types';
import { RETURN_REASONS, type ResolutionType, type ReturnReason } from '../types';
import { ExchangeVariantPicker } from './exchange-variant-picker';
import { useCustomerReturn } from '../use-customer-return';

export function CustomerReturnDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    isLoading,
    isError,
    ineligible,
    eligible,
    rows,
    lines,
    setLine,
    resolutionType,
    setResolutionType,
    reason,
    setReason,
    note,
    setNote,
    formError,
    submit,
    isPending,
  } = useCustomerReturn(order, open, () => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-6">
          <DialogTitle>Request a return</DialogTitle>
          <DialogDescription>
            Order {order.orderNumber}. Pick the items and how you’d like it resolved.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto p-6">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {isError && (
            <p className="text-sm text-destructive">Couldn’t check return eligibility.</p>
          )}

          {ineligible && (
            <p className="text-sm text-muted-foreground">
              No items on this order are eligible for return right now. The return window may have
              passed, or every item has already been returned.
            </p>
          )}

          {eligible && (
            <>
              {/* Resolution */}
              <div className="space-y-2">
                <Label>Resolution</Label>
                <div className="flex gap-2">
                  {(['REFUND', 'EXCHANGE'] as ResolutionType[]).map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      aria-pressed={resolutionType === rt}
                      onClick={() => setResolutionType(rt)}
                      className={cn(
                        'flex-1 rounded-md border px-4 py-2 text-sm transition-colors',
                        resolutionType === rt
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'hover:bg-accent',
                      )}
                    >
                      {rt === 'REFUND' ? 'Refund' : 'Exchange'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {resolutionType === 'REFUND'
                    ? 'We’ll refund the returned items once received.'
                    : 'Choose a replacement variant for each item; any price difference is settled on resolution.'}
                </p>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <Label>Items</Label>
                <ul className="divide-y rounded-md border">
                  {rows.map(({ ri, oi }) => {
                    const ls = lines[ri.orderItemId];
                    const checked = !!ls?.checked;
                    return (
                      <li key={ri.orderItemId} className="space-y-3 p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`ret-${ri.orderItemId}`}
                            checked={checked}
                            onCheckedChange={(v) =>
                              setLine(ri.orderItemId, { checked: v === true })
                            }
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <Label
                              htmlFor={`ret-${ri.orderItemId}`}
                              className="font-medium leading-snug"
                            >
                              {oi.productName}
                            </Label>
                            {oi.variant && Object.keys(oi.variant).length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {Object.values(oi.variant).join(' · ')}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Up to {ri.returnable} returnable
                            </p>
                          </div>
                          {checked && (
                            <QuantityStepper
                              value={ls?.quantity ?? 1}
                              max={ri.returnable}
                              onChange={(q) => setLine(ri.orderItemId, { quantity: q })}
                            />
                          )}
                        </div>

                        {checked && resolutionType === 'EXCHANGE' && (
                          <div className="rounded-md bg-muted/50 p-3">
                            <p className="mb-2 text-xs font-medium">Replace with</p>
                            <ExchangeVariantPicker
                              productId={oi.productId}
                              currentSkuId={oi.skuId}
                              onChange={(skuId) =>
                                setLine(ri.orderItemId, { exchangeSkuId: skuId })
                              }
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="ret-reason">Reason</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
                  <SelectTrigger id="ret-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="ret-note">Note (optional)</Label>
                <Textarea
                  id="ret-note"
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything we should know?"
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{formError}</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t p-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!eligible || isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Submit return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
