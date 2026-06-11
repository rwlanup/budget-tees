import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { RolesTable } from '@/modules/role/components/roles-table';

export const metadata = { title: 'Roles · Admin', description: 'Manage roles and permissions.' };

export default function RolesPage() {
  return (
    <div>
      <PageHeader
        title="Roles"
        description="Manage roles and the permissions assigned to them."
        action={
          <Button asChild>
            <Link href="/admin/roles/new">
              <Plus className="size-4" aria-hidden />
              New role
            </Link>
          </Button>
        }
      />
      <Suspense>
        <RolesTable />
      </Suspense>
    </div>
  );
}
