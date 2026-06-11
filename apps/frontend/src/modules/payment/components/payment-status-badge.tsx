import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PaymentRecordStatus } from '../types';

const STATUS: Record<PaymentRecordStatus, { label: string; dot: string }> = {
  INITIATED: { label: 'Initiated', dot: 'bg-muted-foreground' },
  PENDING: { label: 'Pending', dot: 'bg-warning' },
  SUCCESS: { label: 'Success', dot: 'bg-success' },
  FAILED: { label: 'Failed', dot: 'bg-destructive' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-destructive' },
  REFUNDED: { label: 'Refunded', dot: 'bg-muted-foreground' },
  PARTIALLY_REFUNDED: { label: 'Part. refunded', dot: 'bg-warning' },
};

export function PaymentStatusBadge({ status }: { status: PaymentRecordStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}
