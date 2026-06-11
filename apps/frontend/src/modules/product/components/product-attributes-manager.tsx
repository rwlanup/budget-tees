'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { DataState } from '@/components/shared/data-state';
import { MultiSelectField } from '@/components/shared/multi-select-field';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import { useAttributes } from '@/modules/attribute/queries';
import { isVariationType, type AttributeType } from '@/modules/attribute/types';
import { useProductAttributes, useSetAttributes } from '../queries';

interface RowState {
  included: boolean;
  valueIds: string[];
  isVariation: boolean;
}

export function ProductAttributesManager({ productId }: { productId: string }) {
  const { data: attributes, isLoading, isError, refetch } = useAttributes();
  const { data: assignment } = useProductAttributes(productId);
  const save = useSetAttributes(productId);

  const [rows, setRows] = React.useState<Record<string, RowState>>({});

  // Seed working state from the current assignment.
  const seedKey = (assignment ?? [])
    .map((a) => `${a.attributeId}:${a.isVariation}:${a.values.map((v) => v.id).join(',')}`)
    .join('|');
  React.useEffect(() => {
    const next: Record<string, RowState> = {};
    for (const a of assignment ?? []) {
      next[a.attributeId] = {
        included: true,
        valueIds: a.values.map((v) => v.id),
        isVariation: a.isVariation,
      };
    }
    setRows(next);
  }, [seedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const get = (id: string): RowState =>
    rows[id] ?? { included: false, valueIds: [], isVariation: false };
  const setRow = (id: string, patch: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...get(id), ...patch } }));

  const includedCount = Object.values(rows).filter((r) => r.included).length;

  const onSave = () => {
    const payload = (attributes ?? [])
      .filter((a) => get(a.id).included)
      .map((a) => ({
        attributeId: a.id,
        isVariation: get(a.id).isVariation,
        valueIds: get(a.id).valueIds,
      }));
    save.mutate(payload, {
      onSuccess: () => toast.success('Attributes saved'),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to save attributes'),
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Alert>
          <Info className="size-4" aria-hidden />
          <AlertTitle>Attributes & variation axes</AlertTitle>
          <AlertDescription>
            Include attributes that apply to this product. Mark SELECT/MULTISELECT/COLOR attributes
            as variation axes — those drive SKU generation in Variants.
          </AlertDescription>
        </Alert>

        <DataState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          loadingFallback={<Skeleton className="h-48 w-full" />}
        >
          {(attributes ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              No attributes defined. Create attributes first.
            </p>
          ) : (
            <div className="space-y-4">
              {(attributes ?? []).map((attr, i) => {
                const row = get(attr.id);
                const canVary = isVariationType(attr.type as AttributeType);
                const valueOptions = attr.values.map((v) => ({ value: v.id, label: v.value }));
                return (
                  <div key={attr.id}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={row.included}
                        onCheckedChange={(v) => setRow(attr.id, { included: v === true })}
                        className="mt-1"
                        aria-label={`Include ${attr.name}`}
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{attr.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {attr.type}
                          </Badge>
                        </div>

                        {row.included && (
                          <div className="space-y-3">
                            <MultiSelectField
                              options={valueOptions}
                              value={row.valueIds}
                              onChange={(v) => setRow(attr.id, { valueIds: v })}
                              placeholder="Select values"
                              emptyText="No values — add them in Attributes"
                            />
                            <label className="flex items-center gap-2 text-sm">
                              <Switch
                                checked={row.isVariation}
                                disabled={!canVary}
                                onCheckedChange={(v) => setRow(attr.id, { isVariation: v })}
                              />
                              Variation axis
                              {!canVary && (
                                <span className="text-xs text-muted-foreground">
                                  (type not eligible)
                                </span>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {includedCount === 0
                ? 'Include at least one attribute to save.'
                : `${includedCount} attribute(s) included`}
            </p>
            <Button onClick={onSave} disabled={includedCount === 0 || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save attributes'}
            </Button>
          </div>
        </DataState>
      </CardContent>
    </Card>
  );
}
