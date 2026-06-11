'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PackageX } from 'lucide-react';
import { OrderDetailView } from '@/components/storefront/order-detail-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { useCustomerOrder } from '@/modules/checkout/queries';

export default function OrderDetailPage() {
  const params = useParams<{ idOrNumber: string }>();
  const { data: order, isLoading, isError } = useCustomerOrder(params.idOrNumber);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        icon={PackageX}
        title="Order not found"
        description="This order doesn’t exist or isn’t available."
        action={
          <Button asChild>
            <Link href="/account/orders">Back to orders</Link>
          </Button>
        }
      />
    );
  }

  return <OrderDetailView order={order} />;
}
