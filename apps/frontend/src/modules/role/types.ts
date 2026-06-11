/** Mirrors backend Permission entity. */
export interface Permission {
  id: string;
  key: string;
  description: string | null;
  group: string;
}

/** Mirrors backend Role entity (permissions eager-loaded). */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}
