'use client';

import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { AccountGuard } from '@/components/storefront/account-guard';
import { AccountNav } from '@/components/storefront/account-nav';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontContainer className="py-8">
      <AccountGuard>
        <h1 className="mb-6 font-heading text-2xl font-bold">My account</h1>
        <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
          <aside>
            <AccountNav />
          </aside>
          <div>{children}</div>
        </div>
      </AccountGuard>
    </StorefrontContainer>
  );
}
