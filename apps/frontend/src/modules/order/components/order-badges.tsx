import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '../types';

const ORDER: Record<OrderStatus, { label: string; dot: string }> = {
  PENDING: { label: 'Pending', dot: 'bg-warning' },
  CONFIRMED: { label: 'Confirmed', dot: 'bg-success' },
  PROCESSING: { label: 'Processing', dot: 'bg-success' },
  SHIPPED: { label: 'Shipped', dot: 'bg-success' },
  DELIVERED: { label: 'Delivered', dot: 'bg-success' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', dot: 'bg-success' },
  PICKED_UP: { label: 'Picked up', dot: 'bg-success' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-destructive' },
  REFUNDED: { label: 'Refunded', dot: 'bg-muted-foreground' },
  RETURNED: { label: 'Returned', dot: 'bg-muted-foreground' },
};

const PAYMENT: Record<PaymentStatus, { label: string; dot: string }> = {
  UNPAID: { label: 'Unpaid', dot: 'bg-warning' },
  PAID: { label: 'Paid', dot: 'bg-success' },
  FAILED: { label: 'Failed', dot: 'bg-destructive' },
  REFUNDED: { label: 'Refunded', dot: 'bg-muted-foreground' },
  PARTIALLY_REFUNDED: { label: 'Part. refunded', dot: 'bg-warning' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}
