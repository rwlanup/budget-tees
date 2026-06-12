'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { bottomNav } from '@/config/storefront-nav';
import { useCartUiStore } from '@/lib/storefront/cart-ui-store';

/** Mobile-only fixed bottom tab bar. The Cart tab opens the drawer instead of navigating. */
export function BottomNav() {
  const pathname = usePathname();
  const openCart = useCartUiStore((s) => s.openCart);

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border/60 lg:hidden"
      aria-label="Primary"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {bottomNav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          const className = cn(
            'group flex h-14 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
            active ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
          );
          const iconWrap = cn(
            'flex size-7 items-center justify-center rounded-full transition-all duration-200 group-active:scale-90',
            active && 'bg-brand-muted',
          );
          const inner = (
            <>
              <span className={iconWrap}>
                <Icon className="size-5" aria-hidden />
              </span>
              {item.title}
            </>
          );

          if (item.href === '/cart') {
            return (
              <li key={item.href}>
                <button type="button" onClick={openCart} className={className} aria-label="Cart">
                  {inner}
                </button>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link href={item.href} className={className}>
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
