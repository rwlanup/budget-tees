import { SiteHeader } from '@/components/storefront/site-header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="bg-aurora relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="reveal-in w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
