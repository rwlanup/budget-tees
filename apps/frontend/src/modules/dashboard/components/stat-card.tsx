import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  return (
    <Link href={href} className="block rounded-lg transition-colors hover:bg-accent/40">
      <Card className={cn(attention && (value ?? 0) > 0 && 'border-warning/60')}>
        <CardContent className="flex items-center gap-4 pt-6">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-md',
              attention && (value ?? 0) > 0
                ? 'bg-warning/15 text-warning-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-7 w-12" />
            ) : (
              <p className="font-heading text-2xl font-bold tabular-nums">
                {isError ? '—' : (value ?? 0)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
