'use client';

import Link from 'next/link';
import { ShoppingCart, TriangleAlert } from 'lucide-react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { AccountGuard } from '@/components/storefront/account-guard';
import { CheckoutView } from '@/components/storefront/checkout-view';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCart } from '@/modules/cart/queries';

function CheckoutInner() {
  const { data: cart, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Add items before checking out."
        action={
          <Button asChild>
            <Link href="/shop">Shop now</Link>
          </Button>
        }
      />
    );
  }

  const hasUnavailable = cart.items.some((l) => l.unavailable || !l.inStock);
  if (hasUnavailable) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="size-4" aria-hidden />
        <AlertTitle>Some items need attention</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>Remove unavailable items or reduce quantities before checkout.</span>
          <Button asChild size="sm" variant="outline">
            <Link href="/cart">Review cart</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <CheckoutView />;
}

export default function CheckoutPage() {
  return (
    <StorefrontContainer className="py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Checkout</h1>
      <AccountGuard>
        <CheckoutInner />
      </AccountGuard>
    </StorefrontContainer>
  );
}
