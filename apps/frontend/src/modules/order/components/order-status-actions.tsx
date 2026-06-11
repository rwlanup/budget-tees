'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { useFulfillment, useUpdateStatus } from '../queries';
import { allowedTransitions, type Order, type OrderStatus } from '../types';

function label(s: OrderStatus) {
  const map: Partial<Record<OrderStatus, string>> = {
    CONFIRMED: 'Confirm',
    PROCESSING: 'Mark processing',
    SHIPPED: 'Mark shipped',
    DELIVERED: 'Mark delivered',
    READY_FOR_PICKUP: 'Ready for pickup',
    PICKED_UP: 'Mark picked up',
    CANCELLED: 'Cancel order',
  };
  return map[s] ?? s;
}

export function OrderStatusActions({ order }: { order: Order }) {
  const updateStatus = useUpdateStatus(order.id);
  const fulfillment = useFulfillment(order.id);

  const [shipOpen, setShipOpen] = React.useState(false);
  const [carrier, setCarrier] = React.useState('');
  const [tracking, setTracking] = React.useState('');
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  const targets = allowedTransitions(order.status, order.fulfillmentMethod);
  if (targets.length === 0) {
    return <p className="text-sm text-muted-foreground">No further status changes available.</p>;
  }

  const advance = (status: OrderStatus) =>
    updateStatus.mutate(
      { status },
      {
        onSuccess: () => toast.success(`Order ${status.replace(/_/g, ' ').toLowerCase()}`),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Transition failed'),
      },
    );

  const ship = () => {
    fulfillment.mutate(
      {
        status: 'SHIPPED',
        trackingCarrier: carrier || undefined,
        trackingNumber: tracking || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Order marked shipped');
          setShipOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to ship'),
      },
    );
  };

  const cancel = () => {
    setCancelError(null);
    updateStatus.mutate(
      { status: 'CANCELLED' },
      {
        onSuccess: () => {
          toast.success('Order cancelled');
          setCancelOpen(false);
        },
        onError: (err) =>
          setCancelError(err instanceof ApiError ? err.messages[0] : 'Failed to cancel'),
      },
    );
  };

  const busy = updateStatus.isPending || fulfillment.isPending;

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((t) => {
        if (t === 'CANCELLED') {
          return (
            <Button
              key={t}
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => {
                setCancelError(null);
                setCancelOpen(true);
              }}
            >
              {label(t)}
            </Button>
          );
        }
        if (t === 'SHIPPED') {
          return (
            <Button key={t} disabled={busy} onClick={() => setShipOpen(true)}>
              <Truck className="size-4" aria-hidden />
              {label(t)}
            </Button>
          );
        }
        return (
          <Button key={t} disabled={busy} onClick={() => advance(t)}>
            {label(t)}
          </Button>
        );
      })}

      <Dialog open={shipOpen} onOpenChange={(o) => !fulfillment.isPending && setShipOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as shipped</DialogTitle>
            <DialogDescription>Optionally record tracking details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ship-carrier">Carrier</Label>
              <Input
                id="ship-carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. Aramex"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ship-tracking">Tracking number</Label>
              <Input
                id="ship-tracking"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShipOpen(false)}
              disabled={fulfillment.isPending}
            >
              Cancel
            </Button>
            <Button onClick={ship} disabled={fulfillment.isPending}>
              {fulfillment.isPending ? 'Saving…' : 'Mark shipped'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={(o) => !o && setCancelOpen(false)}
        title={`Cancel order ${order.orderNumber}?`}
        description="Reserved stock is released (or returned if already committed) and any coupon usage is reversed. This cannot be undone."
        confirmLabel="Cancel order"
        destructive
        loading={updateStatus.isPending}
        errorMessage={cancelError}
        onConfirm={cancel}
      />
    </div>
  );
}
