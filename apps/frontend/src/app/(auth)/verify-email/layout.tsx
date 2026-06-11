import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify email',
  description: 'Confirm your Budget Tees email address.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
