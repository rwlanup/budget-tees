import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { saleStatus, type Sale, type SaleStatus } from '../types';

const STATUS: Record<SaleStatus, { label: string; dot: string }> = {
  active: { label: 'Active', dot: 'bg-success' },
  upcoming: { label: 'Upcoming', dot: 'bg-warning' },
  expired: { label: 'Expired', dot: 'bg-muted-foreground' },
  inactive: { label: 'Inactive', dot: 'bg-muted-foreground' },
};

export function SaleStatusBadge({ sale }: { sale: Sale }) {
  const s = STATUS[saleStatus(sale)];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}
