'use client';

import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { AccountGuard } from '@/components/storefront/account-guard';
import { AccountNav } from '@/components/storefront/account-nav';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontContainer className="py-8 sm:py-12">
      <AccountGuard>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Your account
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            My account
          </h1>
        </div>
        <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
          <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </AccountGuard>
    </StorefrontContainer>
  );
}
