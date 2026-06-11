'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataState } from '@/components/shared/data-state';
import { MediaUploader } from '@/modules/media/components/media-uploader';
import { getVariantUrl } from '@/modules/media/lib';
import { ApiError } from '@/lib/api/client';
import { useProductMedia, useSetGallery } from '../queries';
import type { ProductMediaItem } from '../types';

interface WorkingItem {
  mediaId: string;
  url: string;
  isPrimary: boolean;
}

function toWorking(items: ProductMediaItem[]): WorkingItem[] {
  return items.map((it) => ({
    mediaId: it.mediaId,
    url: it.variants.find((v) => v.variant === 'THUMB')?.url ?? it.url ?? '',
    isPrimary: it.isPrimary,
  }));
}

export function ProductGalleryManager({ productId }: { productId: string }) {
  const { data, isLoading, isError, refetch } = useProductMedia(productId);
  const save = useSetGallery(productId);

  const [items, setItems] = React.useState<WorkingItem[]>([]);
  const serverKey = React.useMemo(
    () => (data ?? []).map((i) => `${i.mediaId}:${i.isPrimary}`).join('|'),
    [data],
  );
  React.useEffect(() => {
    if (data) setItems(toWorking(data));
  }, [serverKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const workingKey = items.map((i) => `${i.mediaId}:${i.isPrimary}`).join('|');
  const dirty = workingKey !== serverKey;

  const move = (idx: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const setPrimary = (mediaId: string) =>
    setItems((prev) => prev.map((it) => ({ ...it, isPrimary: it.mediaId === mediaId })));

  const remove = (mediaId: string) =>
    setItems((prev) => {
      const next = prev.filter((it) => it.mediaId !== mediaId);
      if (next.length && !next.some((i) => i.isPrimary)) next[0].isPrimary = true;
      return next;
    });

  const onSave = () => {
    const payload = items.map((it, idx) => ({
      mediaId: it.mediaId,
      sortOrder: idx,
      isPrimary: it.isPrimary,
    }));
    save.mutate(payload, {
      onSuccess: () => toast.success('Gallery saved'),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to save gallery'),
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <MediaUploader
          multiple
          label="Add product images"
          onUploaded={(m) =>
            setItems((prev) => [
              ...prev,
              { mediaId: m.id, url: getVariantUrl(m, 'THUMB'), isPrimary: prev.length === 0 },
            ])
          }
        />

        <DataState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          loadingFallback={<Skeleton className="h-32 w-full" />}
        >
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              No images yet. Upload above.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((it, idx) => (
                <li key={it.mediaId} className="flex items-center gap-3 rounded-lg border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.url} alt="" className="size-14 rounded object-cover" />
                  <div className="flex-1">
                    {it.isPrimary ? (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="size-3 fill-current" aria-hidden />
                        Primary
                      </Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setPrimary(it.mediaId)}>
                        <Star className="size-3.5" aria-hidden />
                        Set primary
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(it.mediaId)}
                      aria-label="Remove"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={!dirty || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save gallery'}
            </Button>
          </div>
        </DataState>
      </CardContent>
    </Card>
  );
}
