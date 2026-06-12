'use client';

import { Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePickupLocations } from '@/modules/checkout/queries';

export function PickupSelect({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data: loc, isLoading } = usePickupLocations();

  if (isLoading) return <Skeleton className="shimmer h-28 w-full rounded-xl" />;
  if (!loc) {
    return (
      <EmptyState
        icon={MapPin}
        title="No pickup locations"
        description="Choose delivery instead."
      />
    );
  }

  const active = selectedId === loc.id;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        key={loc.id}
        type="button"
        onClick={() => onSelect(loc.id)}
        aria-pressed={active}
        className={cn(
          'press relative rounded-xl border p-4 text-left text-sm transition-colors',
          active
            ? 'border-brand bg-brand-muted/40 ring-2 ring-brand/30'
            : 'border-border hover:border-foreground/20 hover:bg-accent',
        )}
      >
        {active && (
          <span className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Check className="size-3" aria-hidden />
          </span>
        )}
        <p className="flex items-center gap-1.5 pr-6 font-semibold">
          <MapPin className="size-4 text-brand" aria-hidden />
          {loc.name}
        </p>
        <p className="mt-1 text-muted-foreground">
          {loc.line1}, {loc.city}
          {loc.region ? `, ${loc.region}` : ''}
        </p>
        {loc.phone && <p className="text-muted-foreground">{loc.phone}</p>}
      </button>
    </div>
  );
}
