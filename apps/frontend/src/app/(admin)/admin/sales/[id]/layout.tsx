import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit sale · Admin',
  description: 'Edit a sale.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
