'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Mail, MessageSquare, Phone } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { useAdminContactMessages, useSetContactStatus } from '../queries';
import { CONTACT_TOPIC_LABELS, CONTACT_TOPICS } from '../schemas';
import type { ContactMessage, ContactStatus } from '../types';
import { ContactStatusBadge } from './contact-status-badge';

const PAGE_SIZE = 20;
const ALL = 'all';
const STATUSES: ContactStatus[] = ['PENDING', 'PROCESSING', 'RESOLVED'];
const STATUS_LABELS: Record<ContactStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  RESOLVED: 'Resolved',
};

export function AdminContactTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const status = (searchParams.get('status') as ContactStatus | null) ?? undefined;
  const topic = (searchParams.get('topic') as ContactMessage['topic'] | null) ?? undefined;

  const setParams = React.useCallback(
    (next: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === '' || v === ALL) params.delete(k);
        else params.set(k, String(v));
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const { data, isLoading, isError, refetch } = useAdminContactMessages({
    page,
    limit: PAGE_SIZE,
    status,
    topic,
  });
  const setStatus = useSetContactStatus();

  const [active, setActive] = React.useState<ContactMessage | null>(null);

  const messages = data?.items ?? [];
  const isEmpty = !isLoading && !isError && messages.length === 0;

  const changeStatus = (m: ContactMessage, next: ContactStatus) => {
    if (next === m.status) return;
    setStatus.mutate(
      { id: m.id, status: next },
      {
        onSuccess: () => toast.success(`Marked ${STATUS_LABELS[next].toLowerCase()}`),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Could not update status'),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={status ?? ALL} onValueChange={(v) => setParams({ status: v, page: 1 })}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={topic ?? ALL} onValueChange={(v) => setParams({ topic: v, page: 1 })}>
          <SelectTrigger className="sm:w-52" aria-label="Filter by topic">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All topics</SelectItem>
            {CONTACT_TOPICS.map((t) => (
              <SelectItem key={t} value={t}>
                {CONTACT_TOPIC_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={MessageSquare}
            title={status || topic ? 'No messages match' : 'No messages yet'}
            description={
              status || topic
                ? 'Try a different filter.'
                : 'Customer contact messages appear here.'
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead className="hidden md:table-cell">Topic</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      {m.firstName} {m.lastName}
                      {!m.userId && (
                        <Badge variant="outline" className="font-normal text-muted-foreground">
                          Guest
                        </Badge>
                      )}
                    </span>
                    <span className="block text-sm text-muted-foreground">{m.email}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {CONTACT_TOPIC_LABELS[m.topic]}
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <span className="line-clamp-2 text-sm text-muted-foreground">{m.message}</span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDate(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={m.status}
                      onValueChange={(v) => changeStatus(m, v as ContactStatus)}
                    >
                      <SelectTrigger className="w-36" aria-label="Set status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="View message"
                      onClick={() => setActive(m)}
                    >
                      <Eye className="size-4" aria-hidden />
                    </Button>
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
            onPageChange={(p) => setParams({ page: p })}
          />
        )}
      </DataState>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {active.firstName} {active.lastName}
                </DialogTitle>
                <DialogDescription>
                  {CONTACT_TOPIC_LABELS[active.topic]} · {formatDate(active.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" aria-hidden />
                    <a href={`mailto:${active.email}`} className="hover:underline">
                      {active.email}
                    </a>
                  </span>
                  <ContactStatusBadge status={active.status} />
                </div>
                {active.phone && (
                  <span className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" aria-hidden />
                    <a href={`tel:${active.phone}`} className="hover:underline">
                      {active.phone}
                    </a>
                  </span>
                )}
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                  {active.message}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
