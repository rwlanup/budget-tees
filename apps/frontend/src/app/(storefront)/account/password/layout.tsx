import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change password',
  description: 'Update your account password.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
