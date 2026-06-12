'use client';

import { Boxes, Clock, PackageSearch, ShoppingBag, Undo2 } from 'lucide-react';
import { Stagger, StaggerItem } from '@/components/motion/reveal';
import { useOrderCount, useReturnCount, useLowStockSkus } from '../queries';
import { StatCard } from './stat-card';

export function DashboardStats() {
  const total = useOrderCount();
  const pending = useOrderCount('PENDING');
  const processing = useOrderCount('PROCESSING');
  const returns = useReturnCount('REQUESTED');
  const lowStock = useLowStockSkus();

  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StaggerItem>
        <StatCard
          label="Total orders"
          value={total.data}
          isLoading={total.isLoading}
          isError={total.isError}
          icon={ShoppingBag}
          href="/admin/orders"
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Pending"
          value={pending.data}
          isLoading={pending.isLoading}
          isError={pending.isError}
          icon={Clock}
          href="/admin/orders?status=PENDING"
          attention
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Processing"
          value={processing.data}
          isLoading={processing.isLoading}
          isError={processing.isError}
          icon={PackageSearch}
          href="/admin/orders?status=PROCESSING"
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Returns to review"
          value={returns.data}
          isLoading={returns.isLoading}
          isError={returns.isError}
          icon={Undo2}
          href="/admin/returns?status=REQUESTED"
          attention
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Low-stock variants"
          value={lowStock.data?.length}
          isLoading={lowStock.isLoading}
          isError={lowStock.isError}
          icon={Boxes}
          href="/admin/skus"
          attention
        />
      </StaggerItem>
    </Stagger>
  );
}
