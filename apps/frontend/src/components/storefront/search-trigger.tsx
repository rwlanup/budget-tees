'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Desktop inline search form; collapses to a search icon → /search on mobile. */
export function SearchTrigger() {
  const router = useRouter();
  const [value, setValue] = React.useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <form onSubmit={submit} className="hidden md:block" role="search">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-48 pl-9 lg:w-64"
          />
        </div>
      </form>

      <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Search">
        <Link href="/search">
          <Search className="size-5" aria-hidden />
        </Link>
      </Button>
    </>
  );
}
