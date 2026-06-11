'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SettingRecord } from '../types';

interface SettingFieldProps {
  setting: SettingRecord;
  /** Draft value: string for STRING/NUMBER/JSON/STRING_ARRAY, boolean for BOOLEAN. */
  draft: unknown;
  onChange: (next: unknown) => void;
  error?: string;
}

/** Renders a single setting input keyed by its declared type. */
export function SettingField({ setting, draft, onChange, error }: SettingFieldProps) {
  const id = `setting-${setting.key}`;
  const describedBy = `${id}-desc`;

  return (
    <div className="grid gap-2 sm:grid-cols-[280px_1fr] sm:items-start sm:gap-6">
      <div className="space-y-1">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
          <code className="text-xs">{setting.key}</code>
          {setting.isPublic && (
            <Badge variant="secondary" className="text-[10px]">
              Public
            </Badge>
          )}
        </label>
        <p id={describedBy} className="text-xs text-muted-foreground">
          {setting.description}
        </p>
      </div>

      <div className="space-y-1">
        {setting.type === 'BOOLEAN' ? (
          <Switch
            id={id}
            checked={!!draft}
            onCheckedChange={(v) => onChange(v)}
            aria-describedby={describedBy}
          />
        ) : setting.type === 'NUMBER' ? (
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            value={String(draft ?? '')}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={!!error}
            className="max-w-xs"
          />
        ) : setting.type === 'JSON' ? (
          <Textarea
            id={id}
            value={String(draft ?? '')}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            spellCheck={false}
            className="font-mono text-xs"
            aria-describedby={describedBy}
            aria-invalid={!!error}
          />
        ) : setting.type === 'STRING_ARRAY' ? (
          <Textarea
            id={id}
            value={String(draft ?? '')}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder="One value per line"
            aria-describedby={describedBy}
            aria-invalid={!!error}
          />
        ) : (
          <Input
            id={id}
            value={String(draft ?? '')}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={!!error}
          />
        )}
        {setting.type === 'STRING_ARRAY' && !error && (
          <p className="text-xs text-muted-foreground">One value per line.</p>
        )}
        {error && (
          <p className={cn('text-xs font-medium text-destructive')} role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
