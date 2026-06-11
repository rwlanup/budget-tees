import { AnnouncementBar } from '@/components/storefront/announcement-bar';
import { SiteHeader } from '@/components/storefront/site-header';
import { SiteFooter } from '@/components/storefront/site-footer';
import { CartDrawer } from '@/components/storefront/cart-drawer';
import { BottomNav } from '@/components/storefront/bottom-nav';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar message="Free shipping on orders over Rs. 2000 · Cash on delivery available" />
      <SiteHeader />
      <main className="flex-1 pb-14 lg:pb-0">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <BottomNav />
    </div>
  );
}
