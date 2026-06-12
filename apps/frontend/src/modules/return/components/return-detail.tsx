'use client';

import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataState } from '@/components/shared/data-state';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useOrder } from '@/modules/order/queries';
import { useReturn } from '../queries';
import type { ReturnRequest } from '../types';
import { ReturnStatusBadge } from './return-status-badge';
import { ReceivePanel, ResolvePanel, ReviewPanel } from './return-stage-panels';

function titleCase(s: string) {
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function StagePanel({
  request,
  itemName,
}: {
  request: ReturnRequest;
  itemName: (id: string) => string;
}) {
  switch (request.status) {
    case 'REQUESTED':
      return <ReviewPanel request={request} />;
    case 'AWAITING_ITEMS':
    case 'APPROVED':
      return <ReceivePanel request={request} itemName={itemName} />;
    case 'RECEIVED':
      return <ResolvePanel request={request} />;
    default:
      return (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            This return is {titleCase(request.status).toLowerCase()} — no further action.
            {request.resolvedAt && <> Resolved {formatDate(request.resolvedAt)}.</>}
          </CardContent>
        </Card>
      );
  }
}

export function ReturnDetail({ id }: { id: string }) {
  const { data: request, isLoading, isError, refetch } = useReturn(id);
  const { data: order } = useOrder(request?.orderId ?? '');

  const itemName = (orderItemId: string) => {
    const oi = order?.items.find((i) => i.id === orderItemId);
    if (!oi) return orderItemId.slice(0, 8) + '…';
    const variant =
      oi.variant && Object.keys(oi.variant).length
        ? ` (${Object.values(oi.variant).join(' / ')})`
        : '';
    return `${oi.productName}${variant}`;
  };

  return (
    <DataState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      loadingFallback={<Skeleton className="h-96 w-full" />}
    >
      {request && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{request.returnNumber}</h1>
            <ReturnStatusBadge status={request.status} />
            <Badge variant="outline">{request.resolutionType}</Badge>
            <Link
              href={`/admin/orders/${request.orderId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              View order
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="hidden sm:table-cell">Condition</TableHead>
                        <TableHead className="hidden sm:table-cell">Restock</TableHead>
                        <TableHead className="text-right">Refund</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {request.items.map((it) => {
                        const ex = it.exchangeSku;
                        const exVariant =
                          ex?.variant && Object.keys(ex.variant).length
                            ? Object.values(ex.variant).join(' / ')
                            : '';
                        return (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium">
                            {itemName(it.orderItemId)}
                            {request.resolutionType === 'EXCHANGE' && ex && (
                              <span className="mt-1 flex items-center gap-1">
                                <ArrowLeftRight className="size-3 shrink-0" aria-hidden />
                                {ex.productName}
                                {exVariant ? ` · ${exVariant}` : ''}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {it.conditionOnReceipt ? titleCase(it.conditionOnReceipt) : '—'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {it.restock ? 'Yes' : 'No'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {it.lineRefundAmount != null
                              ? formatCurrency(it.lineRefundAmount)
                              : '—'}
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <StagePanel request={request} itemName={itemName} />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason</span>
                    <span>{titleCase(request.reason)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution</span>
                    <span>{request.resolutionType}</span>
                  </div>
                  {request.refundAmount != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Refund</span>
                      <span className="tabular-nums">{formatCurrency(request.refundAmount)}</span>
                    </div>
                  )}
                  {request.priceDifference != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price difference</span>
                      <span className="tabular-nums">
                        {formatCurrency(request.priceDifference)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested</span>
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {(request.customerNote || request.adminNote) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {request.customerNote && (
                      <p>
                        <span className="font-medium text-foreground">Customer:</span>{' '}
                        {request.customerNote}
                      </p>
                    )}
                    {request.adminNote && (
                      <p>
                        <span className="font-medium text-foreground">Admin:</span>{' '}
                        {request.adminNote}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </DataState>
  );
}
