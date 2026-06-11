import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '@/modules/order/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  READY_FOR_PICKUP: 'Ready for pickup',
  PICKED_UP: 'Picked up',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  RETURNED: 'Returned',
};

const SUCCESS = new Set<OrderStatus>(['DELIVERED', 'PICKED_UP']);
const DANGER = new Set<OrderStatus>(['CANCELLED', 'REFUNDED', 'RETURNED']);

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = SUCCESS.has(status)
    ? 'bg-success text-success-foreground'
    : DANGER.has(status)
      ? 'bg-destructive text-destructive-foreground'
      : '';
  if (tone) return <Badge className={cn(tone, 'hover:opacity-90')}>{STATUS_LABEL[status]}</Badge>;
  return <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>;
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  FAILED: 'Payment failed',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially refunded',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  if (status === 'PAID')
    return (
      <Badge className="bg-success text-success-foreground hover:opacity-90">
        {PAYMENT_LABEL[status]}
      </Badge>
    );
  if (status === 'FAILED')
    return (
      <Badge className="bg-destructive text-destructive-foreground hover:opacity-90">
        {PAYMENT_LABEL[status]}
      </Badge>
    );
  return <Badge variant="outline">{PAYMENT_LABEL[status]}</Badge>;
}
