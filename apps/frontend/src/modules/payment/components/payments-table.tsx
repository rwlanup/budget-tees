'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { BanknoteArrowDown, CreditCard, MoreHorizontal, Undo2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useMarkOrderPaid, usePayments } from '../queries';
import { isCodSettleable, isRefundable, type Payment } from '../types';
import { PaymentStatusBadge } from './payment-status-badge';
import { RefundDialog } from './refund-dialog';

const PAGE_SIZE = 20;

export function PaymentsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const { data, isLoading, isError, refetch } = usePayments({ page, limit: PAGE_SIZE });
  const markPaid = useMarkOrderPaid();

  const [refundTarget, setRefundTarget] = React.useState<Payment | null>(null);
  const [codTarget, setCodTarget] = React.useState<Payment | null>(null);
  const [codError, setCodError] = React.useState<string | null>(null);

  const confirmCodPaid = () => {
    if (!codTarget) return;
    setCodError(null);
    markPaid.mutate(codTarget.orderId, {
      onSuccess: () => {
        toast.success('COD payment settled');
        setCodTarget(null);
      },
      onError: (err) =>
        setCodError(err instanceof ApiError ? err.messages[0] : 'Failed to mark paid'),
    });
  };

  const payments = data?.items ?? [];
  const isEmpty = !isLoading && !isError && payments.length === 0;

  return (
    <div className="space-y-4">
      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            description="Payments appear here as orders are paid."
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Reference</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${p.orderId}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {p.order?.orderNumber ?? p.orderId.slice(0, 8) + '...'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {p.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.amount, p.currency)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <code className="text-xs text-muted-foreground">
                      {p.gatewayTxnId ?? p.gatewayRef ?? '—'}
                    </code>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDate(p.paidAt ?? p.createdAt)}
                  </TableCell>
                  <TableCell>
                    {(isRefundable(p) || isCodSettleable(p)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Payment actions">
                            <MoreHorizontal className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isRefundable(p) && (
                            <DropdownMenuItem onSelect={() => setRefundTarget(p)}>
                              <Undo2 className="size-4" aria-hidden />
                              Record refund
                            </DropdownMenuItem>
                          )}
                          {isCodSettleable(p) && (
                            <DropdownMenuItem
                              onSelect={() => {
                                setCodError(null);
                                setCodTarget(p);
                              }}
                            >
                              <BanknoteArrowDown className="size-4" aria-hidden />
                              Mark COD paid
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={setPage}
          />
        )}
      </DataState>

      <RefundDialog
        open={!!refundTarget}
        onOpenChange={(o) => !o && setRefundTarget(null)}
        payment={refundTarget}
      />

      <ConfirmDialog
        open={!!codTarget}
        onOpenChange={(o) => !o && setCodTarget(null)}
        title="Mark COD payment as paid?"
        description="Records the cash-on-delivery payment as settled for this order."
        confirmLabel="Mark paid"
        loading={markPaid.isPending}
        errorMessage={codError}
        onConfirm={confirmCodPaid}
      />
    </div>
  );
}
