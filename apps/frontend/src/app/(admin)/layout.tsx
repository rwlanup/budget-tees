import { AdminGuard } from '@/components/layout/admin-guard';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminTopbar } from '@/components/layout/admin-topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-dvh bg-muted/30">
        <AdminSidebar />
        <div className="lg:pl-64">
          <AdminTopbar />
          <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
