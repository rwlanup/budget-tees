'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ApiError } from '@/lib/api/client';
import { useBulkUpsertSettings } from '../queries';
import type { SettingRecord } from '../types';
import { SettingField } from './setting-field';

/** Convert a stored value into the editable draft representation. */
function valueToDraft(s: SettingRecord): unknown {
  switch (s.type) {
    case 'BOOLEAN':
      return !!s.value;
    case 'JSON':
      return JSON.stringify(s.value ?? null, null, 2);
    case 'STRING_ARRAY':
      return Array.isArray(s.value) ? s.value.join('\n') : '';
    default:
      return s.value == null ? '' : String(s.value);
  }
}

/** Coerce a draft back to a typed value, throwing a message on invalid input. */
function coerceDraft(s: SettingRecord, draft: unknown): unknown {
  switch (s.type) {
    case 'BOOLEAN':
      return !!draft;
    case 'NUMBER': {
      const str = String(draft ?? '').trim();
      if (str === '') throw new Error('Required');
      const n = Number(str);
      if (Number.isNaN(n)) throw new Error('Must be a number');
      return n;
    }
    case 'JSON': {
      try {
        return JSON.parse(String(draft ?? ''));
      } catch {
        throw new Error('Invalid JSON');
      }
    }
    case 'STRING_ARRAY':
      return String(draft ?? '')
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean);
    default:
      return String(draft ?? '');
  }
}

export function SettingsGroupForm({ settings }: { settings: SettingRecord[] }) {
  const save = useBulkUpsertSettings();

  const initial = React.useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const s of settings) map[s.key] = valueToDraft(s);
    return map;
  }, [settings]);

  const [drafts, setDrafts] = React.useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Re-seed when underlying settings change (after a save / refetch).
  React.useEffect(() => setDrafts(initial), [initial]);

  const dirty = React.useMemo(
    () => settings.some((s) => JSON.stringify(drafts[s.key]) !== JSON.stringify(initial[s.key])),
    [settings, drafts, initial],
  );

  const onSave = () => {
    const nextErrors: Record<string, string> = {};
    const items: { key: string; value: unknown }[] = [];

    for (const s of settings) {
      let coerced: unknown;
      try {
        coerced = coerceDraft(s, drafts[s.key]);
      } catch (e) {
        nextErrors[s.key] = (e as Error).message;
        continue;
      }
      const original = coerceDraft(s, initial[s.key]);
      if (JSON.stringify(coerced) !== JSON.stringify(original))
        items.push({ key: s.key, value: coerced });
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (items.length === 0) return;

    save.mutate(items, {
      onSuccess: () => toast.success(`Saved ${items.length} setting${items.length > 1 ? 's' : ''}`),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to save settings'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {settings.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 && <Separator />}
            <SettingField
              setting={s}
              draft={drafts[s.key]}
              error={errors[s.key]}
              onChange={(next) => setDrafts((prev) => ({ ...prev, [s.key]: next }))}
            />
          </React.Fragment>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={!dirty || save.isPending}>
          <Save className="size-4" aria-hidden />
          {save.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
