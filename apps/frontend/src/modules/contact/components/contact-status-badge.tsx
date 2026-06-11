import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ContactStatus } from '../types';

const STATUS: Record<ContactStatus, { label: string; dot: string }> = {
  PENDING: { label: 'Pending', dot: 'bg-warning' },
  PROCESSING: { label: 'Processing', dot: 'bg-foreground' },
  RESOLVED: { label: 'Resolved', dot: 'bg-success' },
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}
