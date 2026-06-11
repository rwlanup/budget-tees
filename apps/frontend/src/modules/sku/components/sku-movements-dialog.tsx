'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataState } from '@/components/shared/data-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useSkuMovements } from '../queries';
import type { Sku, StockMovementType } from '../types';
import Link from 'next/link';

const SIGN: Record<StockMovementType, '+' | '-' | ''> = {
  RESERVE: '-',
  COMMIT: '',
  RELEASE: '+',
  ADJUST: '',
  RESTOCK: '+',
  RETURN: '+',
};

export function SkuMovementsDialog({
  open,
  onOpenChange,
  sku,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku: Sku | null;
}) {
  const { data, isLoading, isError, refetch } = useSkuMovements(sku?.id ?? '', open && !!sku);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock movements — {sku?.sku}</DialogTitle>
          <DialogDescription>Append-only inventory ledger for this variant.</DialogDescription>
        </DialogHeader>

        <DataState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && !isError && (data?.length ?? 0) === 0}
          loadingFallback={<Skeleton className="h-40 w-full" />}
          emptyFallback={
            <p className="py-8 text-center text-sm text-muted-foreground">No movements yet.</p>
          }
        >
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="hidden sm:table-cell">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(m.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {m.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {SIGN[m.type]}
                      {m.qty}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {m.refId && ['order', 'return', 'exchange'].includes(m.refType || '') ? (
                        <Link
                          href={
                            m.refType === 'order'
                              ? `/admin/orders/${m.refId}`
                              : `/admin/returns/${m.refId}`
                          }
                        >
                          {m.reason ??
                            (m.refType ? `${m.refType} ${m.refId?.slice(0, 8) ?? ''}` : '—')}
                        </Link>
                      ) : (
                        (m.reason ??
                        (m.refType ? `${m.refType} ${m.refId?.slice(0, 8) ?? ''}` : '—'))
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DataState>
      </DialogContent>
    </Dialog>
  );
}
