'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { siteConfig } from '@/config/site';
import { Logo } from '@/components/shared/logo';
import { AdminNavList } from './admin-nav-list';

/** Mobile (<lg) nav trigger → slide-in sheet with the same nav list. */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="h-16 justify-center border-b px-5">
          <SheetTitle className="flex items-center" aria-label={siteConfig.name}>
            <Logo height={32} />
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto">
          <AdminNavList onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
