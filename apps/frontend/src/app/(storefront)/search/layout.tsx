import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Budget Tees for tees and apparel.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
