import { Truck, BadgeDollarSign, RotateCcw } from 'lucide-react';
import { StorefrontContainer } from './storefront-container';

const items = [
  { icon: Truck, title: 'Fast delivery', desc: 'Across Nepal' },
  { icon: BadgeDollarSign, title: 'Cash on delivery', desc: 'Pay when it arrives' },
  { icon: RotateCcw, title: 'Easy returns', desc: 'Hassle-free' },
];

export function TrustBar() {
  return (
    <section className="border-b">
      <StorefrontContainer className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="flex items-center justify-center gap-3 text-sm">
              <Icon className="size-5 text-muted-foreground" aria-hidden />
              <span>
                <span className="font-medium">{it.title}</span>
                <span className="ml-1 text-muted-foreground">· {it.desc}</span>
              </span>
            </div>
          );
        })}
      </StorefrontContainer>
    </section>
  );
}
