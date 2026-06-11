import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { UsersTable } from '@/modules/user/components/users-table';

export const metadata = { title: 'Users · Admin', description: 'Manage user accounts.' };

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage accounts, roles, and account status."
        action={
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="size-4" aria-hidden />
              New user
            </Link>
          </Button>
        }
      />
      <Suspense>
        <UsersTable />
      </Suspense>
    </div>
  );
}
