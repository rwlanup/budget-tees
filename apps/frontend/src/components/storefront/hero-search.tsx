'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopTags } from '@/modules/catalog/queries';
import { StorefrontContainer } from './storefront-container';

/** Homepage hero with inline search (no carousel, per design). */
export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState('');
  const { data: topTags, isLoading: tagsLoading } = useTopTags();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <section className="bg-aurora relative overflow-hidden border-b">
      {/* faint grid + glow flourish */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 mask-[radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
        aria-hidden
      />
      <StorefrontContainer className="py-20 text-center sm:py-28 lg:py-32">
        <div className="reveal-scale mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-muted/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-strong dark:text-brand">
          Simple, Affordable, Everyday
        </div>

        <h1 className="reveal mx-auto max-w-4xl font-heading text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Quality tees that <span className="text-gradient">fit your budget</span>
        </h1>
        <p className="reveal mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Shop the latest drops. Pick your size and colour, add to cart in one tap.
        </p>

        <form
          onSubmit={submit}
          role="search"
          className="reveal mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-2xl border bg-card p-2 shadow-lg"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for tees, hoodies…"
              aria-label="Search products"
              className="h-11 border-0 bg-transparent pl-11 text-base shadow-none focus-visible:ring-0"
            />
          </div>
          <Button type="submit" size="lg" variant="brand" className="h-11 shrink-0 rounded-xl">
            Search
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {tagsLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8.5 w-16 rounded-full" />
            ))}
          {(topTags ?? []).map((tag) => (
            <Link
              key={tag.id}
              href={`/search?q=${encodeURIComponent(tag.name)}`}
              className="press rounded-full border bg-card/60 px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              {tag.name}
            </Link>
          ))}
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-brand hover:underline"
          >
            Browse all
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </StorefrontContainer>
    </section>
  );
}
