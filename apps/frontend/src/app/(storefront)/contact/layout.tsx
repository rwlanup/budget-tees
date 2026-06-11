import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Get in touch with the Budget Tees team about orders, products, or returns.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
