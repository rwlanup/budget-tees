import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My orders',
  description: 'View your Budget Tees order history.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
