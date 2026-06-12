import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FulfillmentMethod, OrderStatus } from '@/modules/order/types';

const DELIVERY_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
];

const PICKUP_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'READY_FOR_PICKUP', label: 'Ready' },
  { status: 'PICKED_UP', label: 'Picked up' },
];

const TERMINAL: Partial<Record<OrderStatus, string>> = {
  CANCELLED: 'This order was cancelled.',
  REFUNDED: 'This order was refunded.',
  RETURNED: 'This order was returned.',
};

export function OrderTracking({
  status,
  method,
}: {
  status: OrderStatus;
  method: FulfillmentMethod;
}) {
  if (TERMINAL[status]) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">
        <X className="size-4 shrink-0" aria-hidden />
        {TERMINAL[status]}
      </div>
    );
  }

  const steps = method === 'PICKUP' ? PICKUP_STEPS : DELIVERY_STEPS;
  const current = steps.findIndex((s) => s.status === status);

  return (
    <ol className="flex items-start">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  done && 'border-success bg-success text-success-foreground',
                  active && 'border-brand bg-brand text-brand-foreground shadow-brand',
                  !done && !active && 'border-border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-center text-[11px] leading-tight',
                  active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'mx-1 mt-4 h-0.5 flex-1 self-start rounded-full',
                  i < current ? 'bg-success' : 'bg-border',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
