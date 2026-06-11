'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { CatalogView } from '@/components/storefront/catalog-view';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';

function SearchInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get('q') ?? '';
  const [value, setValue] = React.useState(q);
  React.useEffect(() => setValue(q), [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = value.trim();
    router.replace(next ? `/search?q=${encodeURIComponent(next)}` : '/search');
  };

  return (
    <StorefrontContainer className="py-8">
      <form onSubmit={submit} role="search" className="mb-6 max-w-xl">
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
            className="pl-9"
            autoFocus
          />
        </div>
      </form>

      {q ? (
        <>
          <h1 className="mb-6 font-heading text-xl font-semibold">Results for “{q}”</h1>
          <CatalogView base={{ search: q }} />
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="Search the store"
          description="Type a product name to begin."
        />
      )}
    </StorefrontContainer>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
