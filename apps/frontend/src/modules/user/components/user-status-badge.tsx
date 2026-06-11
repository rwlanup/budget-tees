import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserStatus } from '../types';

const STATUS: Record<UserStatus, { label: string; dot: string }> = {
  ACTIVE: { label: 'Active', dot: 'bg-success' },
  PENDING: { label: 'Pending', dot: 'bg-warning' },
  SUSPENDED: { label: 'Suspended', dot: 'bg-destructive' },
  DEACTIVATED: { label: 'Deactivated', dot: 'bg-muted-foreground' },
};

/** Status pill — colored dot + label (color is supplementary, not the only signal). */
export function UserStatusBadge({ status }: { status: UserStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}
