import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order details',
  description: 'View details and status for your order.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
