import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { LocationTabs } from '@/modules/location/components/location-tabs';

export const metadata = {
  title: 'Locations · Admin',
  description: 'Manage pickup locations and shipping zones.',
};

export default function LocationsPage() {
  return (
    <div>
      <PageHeader title="Locations" description="Store pickup point and shipping zones." />
      <Suspense>
        <LocationTabs />
      </Suspense>
    </div>
  );
}
