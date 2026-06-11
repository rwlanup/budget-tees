import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductStatus } from '../types';

const STATUS: Record<ProductStatus, { label: string; dot: string }> = {
  DRAFT: { label: 'Draft', dot: 'bg-warning' },
  PUBLISHED: { label: 'Published', dot: 'bg-success' },
  ARCHIVED: { label: 'Archived', dot: 'bg-muted-foreground' },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}
