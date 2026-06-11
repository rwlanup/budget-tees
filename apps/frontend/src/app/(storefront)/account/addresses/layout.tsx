import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Addresses',
  description: 'Manage your saved shipping addresses.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
