'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataState } from '@/components/shared/data-state';
import { useSettings } from '../queries';
import { GROUP_LABELS, type SettingRecord } from '../types';
import { SettingsGroupForm } from './settings-group-form';
import { ShippingCountriesManager } from './shipping-countries-manager';

const GROUP_ORDER = ['store', 'order', 'tax', 'returns', 'email'];
const SHIPPING_TAB = 'shipping';

function orderedGroups(settings: SettingRecord[]): string[] {
  const present = [...new Set(settings.map((s) => s.group))];
  return present.sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a);
    const ib = GROUP_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
}

function groupLabel(group: string) {
  return GROUP_LABELS[group] ?? group.charAt(0).toUpperCase() + group.slice(1);
}

export function SettingsTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: settings, isLoading, isError, refetch } = useSettings();

  const groups = React.useMemo(() => orderedGroups(settings ?? []), [settings]);
  const tabs = [...groups, SHIPPING_TAB];
  const urlTab = searchParams.get('tab');
  const active = urlTab && tabs.includes(urlTab) ? urlTab : (groups[0] ?? SHIPPING_TAB);

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <DataState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      loadingFallback={<Skeleton className="h-96 w-full" />}
    >
      <Tabs value={active} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {groups.map((g) => (
            <TabsTrigger key={g} value={g}>
              {groupLabel(g)}
            </TabsTrigger>
          ))}
          <TabsTrigger value={SHIPPING_TAB}>Shipping</TabsTrigger>
        </TabsList>

        {groups.map((g) => (
          <TabsContent key={g} value={g} className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <SettingsGroupForm settings={(settings ?? []).filter((s) => s.group === g)} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value={SHIPPING_TAB} className="mt-6">
          <ShippingCountriesManager />
        </TabsContent>
      </Tabs>
    </DataState>
  );
}
