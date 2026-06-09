import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../constants/permissions';

export const PERMISSIONS_KEY = 'requiredPermissions';

/** Requires the caller's role to hold ALL listed permissions (enforced by PermissionsGuard). */
export const Permissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
