import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReviewStatus } from '../types';

const STATUS: Record<ReviewStatus, { label: string; dot: string }> = {
  PUBLISHED: { label: 'Published', dot: 'bg-success' },
  HIDDEN: { label: 'Hidden', dot: 'bg-muted-foreground' },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </Badge>
  );
}
