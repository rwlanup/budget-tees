import { z } from 'zod';
import { USER_STATUSES } from './types';

// Mirrors backend PASSWORD_REGEX (upper + lower + digit), length 8–72.
const password = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'At most 72 characters')
  .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include upper, lower, and a digit');

const statusEnum = z.enum(USER_STATUSES as [string, ...string[]]);

/** Mirrors CreateUserDto. */
export const createUserSchema = z.object({
  email: z.email('Enter a valid email'),
  password,
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  roleId: z.uuid('Select a role').optional(),
  status: statusEnum.optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Mirrors UpdateUserDto (no email/password). */
export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  status: statusEnum,
  roleId: z.uuid('Select a role'),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
