'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AddressForm } from '@/components/storefront/address-form';
import { ApiError } from '@/lib/api/client';
import { useAddresses, useDeleteAddress, useUpdateAddress } from '@/modules/account/queries';
import type { UserAddress } from '@/modules/account/types';

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const update = useUpdateAddress();
  const del = useDeleteAddress();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserAddress | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserAddress | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: UserAddress) => {
    setEditing(a);
    setFormOpen(true);
  };

  const setDefault = (a: UserAddress) =>
    update.mutate(
      { id: a.id, body: { isDefault: true } },
      { onError: (err) => toast.error(err instanceof ApiError ? err.messages[0] : 'Failed') },
    );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    del.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Address removed');
        setDeleteTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to remove'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Addresses</h2>
        <Button onClick={openAdd}>
          <Plus className="size-4" aria-hidden />
          Add address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses yet"
          description="Add a delivery address to speed up checkout."
          action={<Button onClick={openAdd}>Add address</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <Card key={a.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{a.label || a.recipientName}</span>
                  <Badge variant="outline">
                    {a.type === 'BILLING'
                      ? 'Billing'
                      : a.type === 'SHIPPING'
                        ? 'Shipping'
                        : 'Shipping & Billing'}
                  </Badge>
                  {a.isDefault && <Badge variant="secondary">Default</Badge>}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  {a.recipientName} · {a.phone}
                </p>
                <p>
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}
                </p>
                <p>
                  {a.city}
                  {a.region ? `, ${a.region}` : ''}
                  {a.postalCode ? ` ${a.postalCode}` : ''} · {a.countryCode}
                </p>
                {a.nearestLandmark && <p>Near {a.nearestLandmark}</p>}
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {!a.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={update.isPending}
                    onClick={() => setDefault(a)}
                  >
                    <Star className="size-4" aria-hidden />
                    Set default
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(a);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddressForm open={formOpen} onOpenChange={setFormOpen} address={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remove this address?"
        description="This can’t be undone."
        confirmLabel="Remove"
        destructive
        loading={del.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
