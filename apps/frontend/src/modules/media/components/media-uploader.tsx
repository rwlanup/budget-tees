'use client';

import * as React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api/client';
import { ACCEPT_ATTR, validateImageFile } from '../lib';
import { useUploadMedia } from '../queries';
import type { Media } from '../types';

interface MediaUploaderProps {
  onUploaded: (media: Media) => void;
  /** Allow selecting multiple files (uploaded sequentially). */
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/** Drag-and-drop / click image uploader with client-side validation. */
export function MediaUploader({
  onUploaded,
  multiple = false,
  disabled,
  className,
  label = 'Drop an image or click to upload',
}: MediaUploaderProps) {
  const upload = useUploadMedia();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const list = multiple ? Array.from(files) : [files[0]];

    for (const file of list) {
      const invalid = validateImageFile(file);
      if (invalid) {
        setError(invalid);
        continue;
      }
      try {
        const media = await upload.mutateAsync({ file });
        onUploaded(media);
      } catch (err) {
        setError(err instanceof ApiError ? err.messages[0] : 'Upload failed');
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const busy = upload.isPending || disabled;

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors',
          dragging ? 'border-primary bg-accent' : 'hover:bg-accent',
          busy && 'pointer-events-none opacity-60',
        )}
        aria-label={label}
      >
        {upload.isPending ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <Upload className="size-6 text-muted-foreground" aria-hidden />
        )}
        <span className="text-sm font-medium">{upload.isPending ? 'Uploading…' : label}</span>
        <span className="text-xs text-muted-foreground">JPEG, PNG, WebP, AVIF · max 5 MB</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple={multiple}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="mt-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
