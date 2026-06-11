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
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden"
      aria-label="Primary"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {bottomNav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          const className = cn(
            'flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]',
            active ? 'text-primary' : 'text-muted-foreground',
          );

          if (item.href === '/cart') {
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={openCart}
                  className={cn(className, 'w-full')}
                  aria-label="Cart"
                >
                  <Icon className="size-5" aria-hidden />
                  {item.title}
                </button>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link href={item.href} className={className}>
                <Icon className="size-5" aria-hidden />
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
