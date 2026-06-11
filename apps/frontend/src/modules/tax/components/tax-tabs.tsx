'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TaxClassesManager } from './tax-classes-manager';
import { TaxRatesManager } from './tax-rates-manager';

const TABS = ['classes', 'rates'] as const;

export function TaxTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab = searchParams.get('tab');
  const active = urlTab && (TABS as readonly string[]).includes(urlTab) ? urlTab : 'classes';

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="size-4" aria-hidden />
        <AlertTitle>Tax-inclusive pricing</AlertTitle>
        <AlertDescription>
          Product prices already include tax. Rates here are used to <strong>extract</strong> the
          embedded tax for breakdowns and reporting — tax is never added on top of the price.
        </AlertDescription>
      </Alert>

      <Tabs value={active} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
        </TabsList>
        <TabsContent value="classes" className="mt-6">
          <TaxClassesManager />
        </TabsContent>
        <TabsContent value="rates" className="mt-6">
          <TaxRatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
