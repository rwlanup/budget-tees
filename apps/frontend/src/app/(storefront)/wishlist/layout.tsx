import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Your saved Budget Tees products.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
