import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order confirmation',
  description: 'Your Budget Tees order status.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
