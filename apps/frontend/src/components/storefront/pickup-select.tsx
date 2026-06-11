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

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!loc) {
    return (
      <EmptyState
        icon={MapPin}
        title="No pickup locations"
        description="Choose delivery instead."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        key={loc.id}
        type="button"
        onClick={() => onSelect(loc.id)}
        className={cn(
          'relative rounded-lg border p-3 text-left text-sm border-primary ring-1 ring-primary',
        )}
      >
        <Check className="absolute right-2 top-2 size-4 text-primary" aria-hidden />
        <p className="font-medium">{loc.name}</p>
        <p className="text-muted-foreground">
          {loc.line1}, {loc.city}
          {loc.region ? `, ${loc.region}` : ''}
        </p>
        {loc.phone && <p className="text-muted-foreground">{loc.phone}</p>}
      </button>
    </div>
  );
}
