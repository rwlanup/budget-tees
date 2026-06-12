'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCategoryTree } from '@/modules/category/queries';
import { Logo } from '@/components/shared/logo';

/** Mobile hamburger navigation: category tree (accordion) + quick links. */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const { data } = useCategoryTree();
  const roots = (data ?? []).filter((c) => c.isActive);

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Logo height={30} />
            <span className="sr-only">Menu</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col px-4 pb-8">
          <Link
            href="/shop"
            onClick={close}
            className="-mx-2 rounded-lg px-2 py-3 text-sm font-semibold transition-colors hover:bg-accent hover:text-brand"
          >
            Shop all
          </Link>
          <Separator />

          <Accordion type="multiple" className="w-full">
            {roots.map((cat) => {
              const children = (cat.children ?? []).filter((c) => c.isActive);
              if (!children.length) {
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={close}
                    className="flex py-3 text-sm font-medium"
                  >
                    {cat.name}
                  </Link>
                );
              }
              return (
                <AccordionItem key={cat.id} value={cat.id} className="border-b-0">
                  <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                    {cat.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col pl-3">
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={close}
                        className="py-2 text-sm font-medium text-muted-foreground"
                      >
                        All {cat.name}
                      </Link>
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/category/${child.slug}`}
                          onClick={close}
                          className="py-2 text-sm text-muted-foreground"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <Separator className="my-2" />
          <Link href="/wishlist" onClick={close} className="py-3 text-sm font-medium">
            Wishlist
          </Link>
          <Link href="/account" onClick={close} className="py-3 text-sm font-medium">
            My account
          </Link>
          <Link href="/account/orders" onClick={close} className="py-3 text-sm font-medium">
            Orders
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
