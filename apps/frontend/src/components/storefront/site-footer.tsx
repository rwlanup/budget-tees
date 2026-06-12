'use client';

import Link from 'next/link';
import { StorefrontContainer } from './storefront-container';
import { footerColumns, paymentMethods } from '@/config/storefront-nav';
import { useStoreConfig } from '@/lib/storefront/use-store-config';

export function SiteFooter() {
  const { storeName, supportEmail } = useStoreConfig();

  return (
    <footer className="mt-20 border-t bg-card">
      <StorefrontContainer className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <span className="font-heading text-xl font-extrabold tracking-tight text-gradient">
              {storeName}
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Quality tees that fit your budget. Fresh drops, fair prices, fast delivery.
            </p>
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                {supportEmail}
              </a>
            )}
          </div>

          {footerColumns.map((col) => (
            <div key={col.heading} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">© {storeName}. All rights reserved.</p>
          <ul className="flex flex-wrap items-center gap-2">
            {paymentMethods.map((m) => (
              <li
                key={m}
                className="rounded-lg border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </StorefrontContainer>
    </footer>
  );
}
