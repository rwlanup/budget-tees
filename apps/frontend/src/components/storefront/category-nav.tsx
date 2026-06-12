'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCategoryTree } from '@/modules/category/queries';
import type { Category } from '@/modules/category/types';

/** Desktop top-level category navigation, sourced from the public category tree. */
export function CategoryNav() {
  const { data, isLoading } = useCategoryTree();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="hidden items-center gap-6 lg:flex">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
    );
  }

  const roots = (data ?? []).filter((c) => c.isActive);
  if (!roots.length) return null;

  const isActive = (slug: string) => pathname === `/category/${slug}`;
  const linkBase =
    'relative inline-flex items-center px-3 py-2 text-sm font-medium transition-colors';

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="gap-0.5">
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className={cn(
              linkBase,
              pathname === '/shop' ? 'text-brand' : 'text-foreground/80 hover:text-foreground',
            )}
          >
            <Link href="/shop">Shop all</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {roots.map((cat) => {
          const children = (cat.children ?? []).filter((c) => c.isActive);
          if (!children.length) {
            return (
              <NavigationMenuItem key={cat.id}>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    linkBase,
                    isActive(cat.slug) ? 'text-brand' : 'text-foreground/80 hover:text-foreground',
                  )}
                >
                  <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }
          return (
            <NavigationMenuItem key={cat.id}>
              <NavigationMenuTrigger
                className={cn(
                  'bg-transparent text-sm font-medium',
                  isActive(cat.slug) ? 'text-brand' : 'text-foreground/80',
                )}
              >
                {cat.name}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-110 grid-cols-2 gap-1 p-3">
                  <li className="col-span-2 mb-1">
                    <NavigationMenuLink asChild>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="flex items-center justify-between rounded-lg bg-brand-muted/50 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-brand-muted"
                      >
                        All {cat.name}
                        <span aria-hidden className="text-brand">
                          →
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  {children.map((child: Category) => (
                    <li key={child.id}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/category/${child.slug}`}
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {child.name}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
