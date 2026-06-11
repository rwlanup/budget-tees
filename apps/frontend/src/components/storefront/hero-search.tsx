'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StorefrontContainer } from './storefront-container';

/** Homepage hero with inline search (no carousel, per design). */
export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <section className="border-b bg-secondary/40">
      <StorefrontContainer className="py-16 text-center md:py-24">
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-bold tracking-tight md:text-5xl">
          Quality tees that fit your budget
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Shop the latest drops. Pick your size and colour, add to cart in one tap.
        </p>

        <form onSubmit={submit} role="search" className="mx-auto mt-8 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for tees, hoodies…"
              aria-label="Search products"
              className="h-11 pl-9"
            />
          </div>
          <Button type="submit" size="lg">
            Search
          </Button>
        </form>

        <div className="mt-4">
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href="/shop">Or browse all products</Link>
          </Button>
        </div>
      </StorefrontContainer>
    </section>
  );
}
