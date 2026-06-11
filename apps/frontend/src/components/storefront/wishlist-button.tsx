'use client';

import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useIsAuthed,
  useToggleWishlist,
  useWishlist,
  useWishlistContains,
} from '@/modules/wishlist/queries';

interface Props {
  /** The variant (SKU) to save. Null disables the button (e.g. no variant chosen yet). */
  skuId: string | null;
  mode?: 'card' | 'detail';
  className?: string;
}

/**
 * Heart toggle for a variant. Both modes toggle add/remove. `detail` reads a
 * per-SKU contains query; `card` derives membership from the cached wishlist
 * list (one shared request for the whole grid). Guests get a sign-in prompt.
 */
export function WishlistButton({ skuId, mode = 'card', className }: Props) {
  const router = useRouter();
  const authed = useIsAuthed();
  const toggle = useToggleWishlist();

  // detail → contains query; card → shared wishlist list membership.
  const { data: contains } = useWishlistContains(skuId ?? '', mode === 'detail' && !!skuId);
  const { data: list } = useWishlist(mode === 'card' && authed);

  const filled =
    mode === 'detail'
      ? !!contains?.wishlisted
      : !!skuId && !!list?.some((item) => item.skuId === skuId);
  const pending = toggle.isPending;

  const promptSignIn = () =>
    toast('Sign in to save items', {
      action: { label: 'Sign in', onClick: () => router.push('/sign-in') },
    });

  const handleClick = () => {
    if (!skuId) return;
    if (!authed) return promptSignIn();
    toggle.mutate(skuId, {
      onSuccess: (s) =>
        toast.success(s.wishlisted ? 'Saved to wishlist' : 'Removed from wishlist'),
      onError: () => toast.error('Could not update wishlist'),
    });
  };

  if (mode === 'detail') {
    return (
      <Button
        type="button"
        variant="outline"
        className={className}
        onClick={handleClick}
        disabled={pending || !skuId}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Heart className={cn('size-4', filled && 'fill-current text-destructive')} aria-hidden />
        )}
        {filled ? 'Saved' : 'Save'}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn('size-8 rounded-full', className)}
      aria-label={filled ? 'Saved to wishlist' : 'Save to wishlist'}
      aria-pressed={filled}
      onClick={handleClick}
      disabled={pending || !skuId}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Heart className={cn('size-4', filled && 'fill-current text-destructive')} aria-hidden />
      )}
    </Button>
  );
}
