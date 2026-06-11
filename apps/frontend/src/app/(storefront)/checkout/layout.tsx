import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your Budget Tees order.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
