import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your cart',
  description: 'Review the items in your shopping cart.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
