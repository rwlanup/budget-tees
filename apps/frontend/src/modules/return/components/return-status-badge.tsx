import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReturnStatus } from '../types';

const STATUS: Record<ReturnStatus, { label: string; dot: string }> = {
  REQUESTED: { label: 'Requested', dot: 'bg-warning' },
  APPROVED: { label: 'Approved', dot: 'bg-success' },
  REJECTED: { label: 'Rejected', dot: 'bg-destructive' },
  AWAITING_ITEMS: { label: 'Awaiting items', dot: 'bg-warning' },
  RECEIVED: { label: 'Received', dot: 'bg-success' },
  COMPLETED: { label: 'Completed', dot: 'bg-success' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-muted-foreground' },
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}
