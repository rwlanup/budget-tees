import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  FolderTree,
  Tags,
  Award,
  Shirt,
  SlidersHorizontal,
  Boxes,
  Ticket,
  Percent,
  Star,
  MessageSquare,
  Mail,
  ShoppingBag,
  CreditCard,
  MapPin,
  Receipt,
  Settings,
  Undo2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Not yet implemented — rendered disabled until its module ships. */
  soon?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Admin sidebar nav. Items flip `soon` off as each module is built. */
export const adminNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Access',
    items: [
      { title: 'Roles', href: '/admin/roles', icon: ShieldCheck },
      { title: 'Users', href: '/admin/users', icon: Users },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { title: 'Categories', href: '/admin/categories', icon: FolderTree },
      { title: 'Tags', href: '/admin/tags', icon: Tags },
      { title: 'Brands', href: '/admin/brands', icon: Award },
      { title: 'Products', href: '/admin/products', icon: Shirt },
      { title: 'Attributes', href: '/admin/attributes', icon: SlidersHorizontal },
      { title: 'Low Stock', href: '/admin/skus', icon: Boxes },
    ],
  },
  {
    label: 'Merchandising',
    items: [
      { title: 'Coupons', href: '/admin/coupons', icon: Ticket },
      { title: 'Sales', href: '/admin/sales', icon: Percent },
      { title: 'Featured', href: '/admin/featured', icon: Star },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { title: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { title: 'Payments', href: '/admin/payments', icon: CreditCard },
      { title: 'Returns', href: '/admin/returns', icon: Undo2 },
      { title: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
      { title: 'Contact', href: '/admin/contact-messages', icon: Mail },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { title: 'Locations', href: '/admin/locations', icon: MapPin },
      { title: 'Tax', href: '/admin/tax', icon: Receipt },
      { title: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];
