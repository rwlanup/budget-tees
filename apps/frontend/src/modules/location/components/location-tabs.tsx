'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PickupManager } from './pickup-manager';
import { ShippingZonesManager } from './shipping-zones-manager';

const TABS = ['store', 'zones'] as const;

export function LocationTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab = searchParams.get('tab');
  const active = urlTab && (TABS as readonly string[]).includes(urlTab) ? urlTab : 'store';

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={active} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="store">Store</TabsTrigger>
        <TabsTrigger value="zones">Shipping zones</TabsTrigger>
      </TabsList>
      <TabsContent value="store" className="mt-6">
        <PickupManager />
      </TabsContent>
      <TabsContent value="zones" className="mt-6">
        <ShippingZonesManager />
      </TabsContent>
    </Tabs>
  );
}
