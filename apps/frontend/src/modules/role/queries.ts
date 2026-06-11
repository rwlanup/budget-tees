'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { permissionApi, roleApi, type ListRolesParams } from './api';

export const roleKeys = {
  all: ['roles'] as const,
  list: (params: ListRolesParams) => [...roleKeys.all, 'list', params] as const,
  detail: (id: string) => [...roleKeys.all, 'detail', id] as const,
};

export const permissionKeys = {
  all: ['permissions'] as const,
};

export function useRoles(params: ListRolesParams) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => roleApi.list(params),
    placeholderData: (prev) => prev, // keep page visible while paginating/searching
  });
}

/** All roles (for select inputs in other modules). Roles are few — fetch a large page. */
export function useRoleOptions() {
  return useQuery({
    queryKey: roleKeys.list({ page: 1, limit: 100 }),
    queryFn: () => roleApi.list({ page: 1, limit: 100 }),
    staleTime: 5 * 60_000,
    select: (data) => data.items,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => roleApi.get(id),
    enabled: !!id,
  });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: permissionKeys.all,
    queryFn: () => permissionApi.list(),
    staleTime: 10 * 60_000, // catalog is effectively static
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roleApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { description?: string }) => roleApi.update(id, body),
    onSuccess: (role) => {
      qc.setQueryData(roleKeys.detail(id), role);
      qc.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useSetPermissions(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissionKeys: string[]) => roleApi.setPermissions(id, permissionKeys),
    onSuccess: (role) => {
      qc.setQueryData(roleKeys.detail(id), role);
      qc.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}
