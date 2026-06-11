import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tags · Admin',
  description: 'Manage product tags.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
