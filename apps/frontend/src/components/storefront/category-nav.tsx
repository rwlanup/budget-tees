'use client';

import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoryTree } from '@/modules/category/queries';
import type { Category } from '@/modules/category/types';

/** Desktop top-level category navigation, sourced from the public category tree. */
export function CategoryNav() {
  const { data, isLoading } = useCategoryTree();

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

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className="px-3 py-2 text-sm font-medium">
            <Link href="/shop">Shop all</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {roots.map((cat) => {
          const children = (cat.children ?? []).filter((c) => c.isActive);
          if (!children.length) {
            return (
              <NavigationMenuItem key={cat.id}>
                <NavigationMenuLink asChild className="px-3 py-2 text-sm font-medium">
                  <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }
          return (
            <NavigationMenuItem key={cat.id}>
              <NavigationMenuTrigger className="text-sm font-medium">
                {cat.name}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[420px] grid-cols-2 gap-1 p-3">
                  <li className="col-span-2">
                    <NavigationMenuLink asChild>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent"
                      >
                        All {cat.name}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  {children.map((child: Category) => (
                    <li key={child.id}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/category/${child.slug}`}
                          className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
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
