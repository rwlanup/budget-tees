'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useReturns } from '../queries';
import { ReturnStatusBadge } from './return-status-badge';

/**
 * Returns tied to an order, shown on the admin order detail page.
 * The list endpoint has no orderId filter, so we pull a page and filter client-side.
 */
export function OrderReturnsCard({ orderId }: { orderId: string }) {
  const { data } = useReturns({ limit: 100 });
  const returns = (data?.items ?? []).filter((r) => r.orderId === orderId);

  if (returns.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Returns</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {returns.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
              <Link
                href={`/admin/returns/${r.id}`}
                className="font-mono text-sm font-medium hover:underline"
              >
                {r.returnNumber}
              </Link>
              <ReturnStatusBadge status={r.status} />
              <Badge variant="outline">{r.resolutionType}</Badge>
              {r.refundAmount != null && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  Refund {formatCurrency(r.refundAmount)}
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(r.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
