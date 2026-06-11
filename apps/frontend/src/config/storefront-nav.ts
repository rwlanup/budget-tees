import { Home, Store, Heart, ShoppingCart, User, type LucideIcon } from 'lucide-react';

export interface StorefrontNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

/** Mobile bottom tab bar (≤5 items, with labels). Cart handled separately (opens drawer). */
export const bottomNav: StorefrontNavItem[] = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Shop', href: '/shop', icon: Store },
  { title: 'Wishlist', href: '/wishlist', icon: Heart },
  { title: 'Cart', href: '/cart', icon: ShoppingCart },
  { title: 'Account', href: '/account', icon: User },
];

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export const footerColumns: FooterColumn[] = [
  {
    heading: 'Shop',
    links: [
      { label: 'All products', href: '/shop' },
      { label: 'New arrivals', href: '/shop?sort=newest' },
      { label: 'Wishlist', href: '/wishlist' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'My account', href: '/account' },
      { label: 'Orders', href: '/account/orders' },
      { label: 'Cart', href: '/cart' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Contact us', href: '/contact' },
      { label: 'Shipping & returns', href: '/help/shipping-returns' },
      { label: 'Track order', href: '/account/orders' },
    ],
  },
];

/** Accepted payment methods shown as badges in the footer. */
export const paymentMethods = ['eSewa', 'Cash on Delivery'] as const;
