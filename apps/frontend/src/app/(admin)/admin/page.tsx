'use client';

import { useAuthStore } from '@/lib/auth/auth-store';
import { Reveal } from '@/components/motion/reveal';
import { DashboardStats } from '@/modules/dashboard/components/dashboard-stats';
import { RecentOrders } from '@/modules/dashboard/components/recent-orders';
import { LowStockPreview } from '@/modules/dashboard/components/low-stock-preview';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      <Reveal as="div" y={10}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Overview
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
          Welcome back{user ? `, ${user.firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here’s what needs your attention.</p>
      </Reveal>

      <DashboardStats />

      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal as="div" className="lg:col-span-2" delay={0.05}>
          <RecentOrders />
        </Reveal>
        <Reveal as="div" delay={0.1}>
          <LowStockPreview />
        </Reveal>
      </div>
    </div>
  );
}
