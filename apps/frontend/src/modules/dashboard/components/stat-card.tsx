import Link from 'next/link';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | undefined;
  isLoading: boolean;
  isError?: boolean;
  icon: LucideIcon;
  href: string;
  /** Highlight when there's something to act on. */
  attention?: boolean;
}

export function StatCard({
  label,
  value,
  isLoading,
  isError,
  icon: Icon,
  href,
  attention,
}: StatCardProps) {
  const needsAttention = attention && (value ?? 0) > 0;

  return (
    <Link href={href} className="group block rounded-xl">
      <Card
        className={cn(
          'press relative h-full overflow-hidden rounded-xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
          needsAttention && 'border-warning/50',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
              needsAttention ? 'bg-warning/15 text-warning' : 'bg-brand-muted text-brand-strong',
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2">
          {isLoading ? (
            <Skeleton className="h-9 w-14" />
          ) : (
            <span className="font-heading text-3xl font-bold leading-none tabular-nums">
              {isError ? '—' : (value ?? 0)}
            </span>
          )}

          {needsAttention && !isLoading && !isError ? (
            <Badge variant="warning" className="text-[10px]">
              Action needed
            </Badge>
          ) : (
            <ArrowUpRight
              className="size-4 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand"
              aria-hidden
            />
          )}
        </div>
      </Card>
    </Link>
  );
}
