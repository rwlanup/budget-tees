import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/query/providers';
import { Toaster } from '@/components/ui/sonner';

// Display / headings — editorial, fashion-forward grotesque
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

// Body / UI — clean, neutral, highly legible
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Budget Tees', template: '%s — Budget Tees' },
  description: 'Budget Tees — quality tees that fit your budget.',
  icons: {
    apple: '/favicon/apple-touch-icon.png',
    icon: '/favicon/favicon.svg',
    shortcut: '/favicon/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
