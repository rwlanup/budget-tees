import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Logo } from '@/components/shared/logo';
import { AdminNavList } from './admin-nav-list';

/** Desktop sidebar (≥lg). Mobile uses the Sheet in MobileNav. */
export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <Link
          href="/admin"
          className="press flex items-center rounded-lg"
          aria-label={siteConfig.name}
        >
          <Logo height={34} priority />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AdminNavList />
      </div>
      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Admin console
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">{siteConfig.name}</p>
      </div>
    </aside>
  );
}
