'use client';

import * as React from 'react';
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataState } from '@/components/shared/data-state';
import { useAttribute } from '../queries';
import { AttributeValuesManager } from './attribute-values-manager';
import { AttributeFormDialog } from './attribute-form-dialog';

export function AttributeDetail({ id }: { id: string }) {
  const { data: attribute, isLoading, isError, refetch } = useAttribute(id);
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <DataState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      loadingFallback={<Skeleton className="h-72 w-full" />}
    >
      {attribute && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">{attribute.name}</h1>
              <Badge variant="outline">{attribute.type}</Badge>
              {attribute.isVariation && <Badge variant="secondary">Variation</Badge>}
              {attribute.isFilterable && <Badge variant="secondary">Filterable</Badge>}
            </div>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden />
              Edit attribute
            </Button>
          </div>

          <AttributeValuesManager attribute={attribute} />

          <AttributeFormDialog open={editOpen} onOpenChange={setEditOpen} attribute={attribute} />
        </div>
      )}
    </DataState>
  );
}
