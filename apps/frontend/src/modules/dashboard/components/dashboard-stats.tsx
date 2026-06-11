'use client';

import { Boxes, Clock, PackageSearch, ShoppingBag, Undo2 } from 'lucide-react';
import { useOrderCount, useReturnCount, useLowStockSkus } from '../queries';
import { StatCard } from './stat-card';

export function DashboardStats() {
  const total = useOrderCount();
  const pending = useOrderCount('PENDING');
  const processing = useOrderCount('PROCESSING');
  const returns = useReturnCount('REQUESTED');
  const lowStock = useLowStockSkus();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Total orders"
        value={total.data}
        isLoading={total.isLoading}
        isError={total.isError}
        icon={ShoppingBag}
        href="/admin/orders"
      />
      <StatCard
        label="Pending"
        value={pending.data}
        isLoading={pending.isLoading}
        isError={pending.isError}
        icon={Clock}
        href="/admin/orders?status=PENDING"
        attention
      />
      <StatCard
        label="Processing"
        value={processing.data}
        isLoading={processing.isLoading}
        isError={processing.isError}
        icon={PackageSearch}
        href="/admin/orders?status=PROCESSING"
      />
      <StatCard
        label="Returns to review"
        value={returns.data}
        isLoading={returns.isLoading}
        isError={returns.isError}
        icon={Undo2}
        href="/admin/returns?status=REQUESTED"
        attention
      />
      <StatCard
        label="Low-stock variants"
        value={lowStock.data?.length}
        isLoading={lowStock.isLoading}
        isError={lowStock.isError}
        icon={Boxes}
        href="/admin/skus"
        attention
      />
    </div>
  );
}
