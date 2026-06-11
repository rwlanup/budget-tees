import { z } from 'zod';

/** Mirrors CreateRoleDto. */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'At least 2 characters')
    .max(50, 'At most 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, digits, or underscore only'),
  description: z.string().max(255, 'At most 255 characters').optional().or(z.literal('')),
  permissionKeys: z.array(z.string()).optional(),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

/** Mirrors UpdateRoleDto (description only; name is immutable). */
export const updateRoleSchema = z.object({
  description: z.string().max(255, 'At most 255 characters').optional().or(z.literal('')),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

/** Mirrors SetPermissionsDto (non-empty, unique). */
export const setPermissionsSchema = z.object({
  permissionKeys: z.array(z.string()).min(1, 'Select at least one permission'),
});
export type SetPermissionsInput = z.infer<typeof setPermissionsSchema>;
