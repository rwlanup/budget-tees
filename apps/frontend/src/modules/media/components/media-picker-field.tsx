'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImageOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MediaUploader } from './media-uploader';
import { MediaImage } from './media-image';
import { mediaKeys, useMedia } from '../queries';
import type { Media } from '../types';

interface MediaPickerFieldProps {
  /** Current media id (form value). */
  value: string | null;
  onChange: (mediaId: string | null) => void;
  className?: string;
  /** Tailwind aspect/box classes for the preview (default square). */
  previewClassName?: string;
}

/** Single-image picker for forms — stores a media id. Upload / preview / remove. */
export function MediaPickerField({
  value,
  onChange,
  className,
  previewClassName = 'aspect-square w-40',
}: MediaPickerFieldProps) {
  const qc = useQueryClient();
  const { data: media, isLoading, isError } = useMedia(value);

  const handleUploaded = (m: Media) => {
    qc.setQueryData(mediaKeys.detail(m.id), m);
    onChange(m.id);
  };

  if (!value) {
    return (
      <div className={className}>
        <MediaUploader onUploaded={handleUploaded} label="Upload image" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('relative overflow-hidden rounded-lg border bg-muted', previewClassName)}>
        {isLoading ? (
          <Skeleton className="size-full" />
        ) : isError || !media ? (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff className="size-6" aria-hidden />
            <span className="text-xs">Image unavailable</span>
          </div>
        ) : (
          <MediaImage media={media} size="MEDIUM" className="size-full" />
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-1 top-1 size-7"
          onClick={() => onChange(null)}
          aria-label="Remove image"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)}>
        Replace
      </Button>
    </div>
  );
}
