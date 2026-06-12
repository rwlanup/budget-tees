import {
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  PackageCheck,
  CreditCard,
  AlertCircle,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

const STATUS_ICON: Record<OrderStatus, LucideIcon> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  PROCESSING: Clock,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  READY_FOR_PICKUP: PackageCheck,
  PICKED_UP: PackageCheck,
  CANCELLED: XCircle,
  REFUNDED: RotateCcw,
  RETURNED: RotateCcw,
};

const SUCCESS = new Set<OrderStatus>(['DELIVERED', 'PICKED_UP']);
const DANGER = new Set<OrderStatus>(['CANCELLED', 'REFUNDED', 'RETURNED']);

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const Icon = STATUS_ICON[status];
  const variant = SUCCESS.has(status)
    ? 'success'
    : DANGER.has(status)
      ? 'destructive'
      : 'secondary';
  return (
    <Badge variant={variant}>
      <Icon className="size-3" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  );
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
      <Badge variant="success">
        <CheckCircle2 className="size-3" aria-hidden />
        {PAYMENT_LABEL[status]}
      </Badge>
    );
  if (status === 'FAILED')
    return (
      <Badge variant="destructive">
        <AlertCircle className="size-3" aria-hidden />
        {PAYMENT_LABEL[status]}
      </Badge>
    );
  return (
    <Badge variant="outline">
      <CreditCard className="size-3" aria-hidden />
      {PAYMENT_LABEL[status]}
    </Badge>
  );
}
