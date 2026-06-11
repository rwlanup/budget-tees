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
import { Logo } from '@/components/shared/logo';
import { siteConfig } from '@/config/site';
import { useCartCount } from '@/modules/cart/queries';

export function SiteHeader() {
  const cartCount = useCartCount();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <StorefrontContainer>
        <div className="flex h-16 items-center gap-2">
          <MobileNav />

          <Link href="/" className="flex items-center" aria-label={siteConfig.name}>
            <Logo height={34} priority />
          </Link>

          <div className="ml-4 hidden flex-1 lg:flex">
            <CategoryNav />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <SearchTrigger />
            <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
              <Link href="/wishlist">
                <Heart className="size-5" aria-hidden />
              </Link>
            </Button>
            <CartButton count={cartCount} />
            <AccountMenu />
            <ThemeToggle />
          </div>
        </div>
      </StorefrontContainer>
    </header>
  );
}
