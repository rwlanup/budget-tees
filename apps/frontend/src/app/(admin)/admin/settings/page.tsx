import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { SettingsTabs } from '@/modules/settings/components/settings-tabs';

export const metadata = { title: 'Settings · Admin', description: 'Manage store settings.' };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Store configuration and shipping destinations." />
      <Suspense>
        <SettingsTabs />
      </Suspense>
    </div>
  );
}
