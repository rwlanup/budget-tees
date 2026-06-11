'use client';

import * as React from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AddressForm } from './address-form';
import { useAddresses } from '@/modules/account/queries';
import type { AddressType, UserAddress } from '@/modules/account/types';

export function AddressSelect({
  selectedId,
  onSelect,
  preferType,
}: {
  selectedId: string | null;
  onSelect: (address: UserAddress) => void;
  /** Auto-select the default address of this type, falling back to any default/first. */
  preferType?: AddressType;
}) {
  const { data: addresses, isLoading } = useAddresses();
  const [formOpen, setFormOpen] = React.useState(false);

  // Auto-select the default (or first) address once loaded.
  React.useEffect(() => {
    if (!selectedId && addresses && addresses.length > 0) {
      // A BOTH address serves either purpose, so it joins both pools.
      const pool = preferType
        ? addresses.filter((a) => a.type === preferType || a.type === 'BOTH')
        : [];
      onSelect(
        pool.find((a) => a.isDefault) ??
          pool[0] ??
          addresses.find((a) => a.isDefault) ??
          addresses[0],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {(addresses ?? []).map((a) => {
          const active = a.id === selectedId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a)}
              className={cn(
                'relative rounded-lg border p-3 text-left text-sm',
                active ? 'border-primary ring-1 ring-primary' : 'hover:bg-accent',
              )}
            >
              {active && (
                <Check className="absolute right-2 top-2 size-4 text-primary" aria-hidden />
              )}
              <p className="font-medium">{a.label || a.recipientName}</p>
              <p className="text-muted-foreground">
                {a.recipientName} · {a.phone}
              </p>
              <p className="text-muted-foreground">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}, {a.city}
                {a.region ? `, ${a.region}` : ''} · {a.countryCode}
              </p>
            </button>
          );
        })}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Add new address
      </Button>
      <AddressForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
