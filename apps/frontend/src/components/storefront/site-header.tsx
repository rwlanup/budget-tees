'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StorefrontContainer } from './storefront-container';
import { CategoryNav } from './category-nav';
import { SearchTrigger } from './search-trigger';
import { MobileNav } from './mobile-nav';
import { AccountMenu } from './account-menu';
import { CartButton } from './cart-button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { NotificationBell } from '@/components/shared/notification-bell';
import { Logo } from '@/components/shared/logo';
import { siteConfig } from '@/config/site';
import { useCartCount } from '@/modules/cart/queries';
import { useWishlistCount } from '@/modules/wishlist/queries';

export function SiteHeader() {
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();

  return (
    <header className="glass sticky top-0 z-30 border-b border-border/60">
      <StorefrontContainer>
        <div className="flex h-16 items-center gap-2 lg:h-18">
          <MobileNav />

          <Link
            href="/"
            className="flex items-center rounded-lg transition-opacity hover:opacity-80"
            aria-label={siteConfig.name}
          >
            <Logo height={60} priority />
          </Link>

          <div className="ml-6 hidden flex-1 lg:flex">
            <CategoryNav />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <SearchTrigger />
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}
              className="relative hover:text-brand"
            >
              <Link href="/wishlist">
                <Heart className="size-5" aria-hidden />
                {wishlistCount > 0 && (
                  <span className="reveal-scale absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-brand-foreground tabular-nums ring-2 ring-background">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            </Button>
            <CartButton count={cartCount} />
            <NotificationBell />
            <AccountMenu />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </StorefrontContainer>
    </header>
  );
}
