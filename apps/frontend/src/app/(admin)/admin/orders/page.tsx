import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { OrdersTable } from '@/modules/order/components/orders-table';

export const metadata = {
  title: 'Orders · Admin',
  description: 'View and manage customer orders.',
};

export default function OrdersPage() {
  return (
    <div>
      <PageHeader title="Orders" description="View orders and advance their fulfillment status." />
      <Suspense>
        <OrdersTable />
      </Suspense>
    </div>
  );
}
