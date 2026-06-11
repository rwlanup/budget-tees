'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DataState } from '@/components/shared/data-state';
import { ApiError } from '@/lib/api/client';
import { usePermissionCatalog, useSetPermissions } from '../queries';
import type { Permission, Role } from '../types';

const GROUP_LABELS: Record<string, string> = {
  rbac: 'RBAC',
  user: 'Users',
  catalog: 'Catalog',
  commerce: 'Commerce',
  system: 'System',
};

function groupLabel(group: string) {
  return GROUP_LABELS[group] ?? group.charAt(0).toUpperCase() + group.slice(1);
}

function sameSet(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function PermissionMatrix({ role }: { role: Role }) {
  const { data: catalog, isLoading, isError, refetch } = usePermissionCatalog();
  const setPermissions = useSetPermissions(role.id);

  const initial = React.useMemo(
    () => new Set(role.permissions.map((p) => p.key)),
    [role.permissions],
  );
  const [selected, setSelected] = React.useState<Set<string>>(initial);

  // Re-seed when the role's permissions change (e.g. after a successful save).
  React.useEffect(() => setSelected(new Set(initial)), [initial]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of catalog ?? []) {
      const arr = map.get(p.group) ?? [];
      arr.push(p);
      map.set(p.group, arr);
    }
    return [...map.entries()];
  }, [catalog]);

  const toggle = (key: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const toggleGroup = (perms: Permission[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of perms) {
        if (on) next.add(p.key);
        else next.delete(p.key);
      }
      return next;
    });

  const dirty = !sameSet(selected, initial);
  const isEmpty = selected.size === 0;

  const save = () => {
    setPermissions.mutate([...selected], {
      onSuccess: () => toast.success('Permissions updated'),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update permissions'),
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-lg">Permissions</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selected.size} selected{dirty && ' · unsaved changes'}
          </p>
        </div>
        <Button onClick={save} disabled={!dirty || isEmpty || setPermissions.isPending}>
          <Save className="size-4" aria-hidden />
          {setPermissions.isPending ? 'Saving…' : 'Save'}
        </Button>
      </CardHeader>
      <CardContent>
        {isEmpty && (
          <p className="mb-4 rounded-md bg-warning/10 px-3 py-2 text-sm text-foreground">
            At least one permission is required to save.
          </p>
        )}
        <DataState isLoading={isLoading} isError={isError} onRetry={refetch}>
          <div className="space-y-6">
            {grouped.map(([group, perms], i) => {
              const allOn = perms.every((p) => selected.has(p.key));
              const someOn = perms.some((p) => selected.has(p.key));
              return (
                <div key={group}>
                  {i > 0 && <Separator className="mb-6" />}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide">
                        {groupLabel(group)}
                      </h3>
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        {perms.filter((p) => selected.has(p.key)).length}/{perms.length}
                      </Badge>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={allOn ? true : someOn ? 'indeterminate' : false}
                        onCheckedChange={(v) => toggleGroup(perms, v === true)}
                        aria-label={`Toggle all ${groupLabel(group)} permissions`}
                      />
                      Select all
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {perms.map((p) => (
                      <label
                        key={p.key}
                        className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent"
                      >
                        <Checkbox
                          checked={selected.has(p.key)}
                          onCheckedChange={(v) => toggle(p.key, v === true)}
                          className="mt-0.5"
                          aria-label={p.key}
                        />
                        <span className="space-y-0.5">
                          <span className="block text-sm font-medium">
                            {p.description ?? p.key}
                          </span>
                          <code className="block text-xs text-muted-foreground">{p.key}</code>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DataState>
      </CardContent>
    </Card>
  );
}
