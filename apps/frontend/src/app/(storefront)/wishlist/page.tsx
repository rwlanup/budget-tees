'use client';

import Link from 'next/link';
import { Heart, LogIn } from 'lucide-react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { WishlistCard } from '@/components/storefront/wishlist-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useIsAuthed, useWishlist } from '@/modules/wishlist/queries';

export default function WishlistPage() {
  const authed = useIsAuthed();
  const { data: items, isLoading } = useWishlist();

  return (
    <StorefrontContainer className="py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Wishlist</h1>

      {!authed ? (
        <EmptyState
          icon={LogIn}
          title="Sign in to view your wishlist"
          description="Save products to your wishlist and find them on any device."
          action={
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here."
          action={
            <Button asChild>
              <Link href="/shop">Browse products</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <WishlistCard key={item.skuId} item={item} />
          ))}
        </div>
      )}
    </StorefrontContainer>
  );
}
