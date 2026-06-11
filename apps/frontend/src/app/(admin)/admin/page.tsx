'use client';

import { useAuthStore } from '@/lib/auth/auth-store';
import { DashboardStats } from '@/modules/dashboard/components/dashboard-stats';
import { RecentOrders } from '@/modules/dashboard/components/recent-orders';
import { LowStockPreview } from '@/modules/dashboard/components/low-stock-preview';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Welcome back{user ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">Here’s what needs your attention.</p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <LowStockPreview />
      </div>
    </div>
  );
}
