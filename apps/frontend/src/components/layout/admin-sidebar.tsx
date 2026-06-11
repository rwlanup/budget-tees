import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Logo } from '@/components/shared/logo';
import { AdminNavList } from './admin-nav-list';

/** Desktop sidebar (≥lg). Mobile uses the Sheet in MobileNav. */
export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <Link href="/admin" className="flex items-center" aria-label={siteConfig.name}>
          <Logo height={34} priority />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AdminNavList />
      </div>
    </aside>
  );
}
