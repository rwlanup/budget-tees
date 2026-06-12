import { Truck, BadgeDollarSign, RotateCcw } from 'lucide-react';
import { StorefrontContainer } from './storefront-container';

const items = [
  { icon: Truck, title: 'Fast delivery', desc: 'Across the region' },
  { icon: BadgeDollarSign, title: 'Cash on delivery', desc: 'Pay when it arrives' },
  { icon: RotateCcw, title: 'Easy returns', desc: 'Hassle-free within return period' },
];

export function TrustBar() {
  return (
    <section className="border-b bg-muted/30">
      <StorefrontContainer className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-3 sm:gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.title}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-xs transition-shadow hover:shadow-sm"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-strong dark:text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{it.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{it.desc}</span>
              </span>
            </div>
          );
        })}
      </StorefrontContainer>
    </section>
  );
}
