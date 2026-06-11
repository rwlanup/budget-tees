export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export const USER_STATUSES: UserStatus[] = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'];

/** Mirrors backend User entity (passwordHash excluded). */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: { id: string; name: string };
  status: UserStatus;
  emailVerifiedAt: string | null;
  avatarMediaId: string | null;
  createdAt: string;
  updatedAt: string;
}
