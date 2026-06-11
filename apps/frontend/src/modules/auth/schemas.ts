import { z } from 'zod';

// Mirrors backend PASSWORD_REGEX: at least one lower, one upper, one digit; length 8–72.
const passwordComplexity = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include upper, lower, and a digit');

/** Mirrors LoginDto — presence only on password (never leak complexity on login). */
export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Mirrors RegisterDto (+ client-only confirm). */
export const signUpSchema = z
  .object({
    firstName: z.string().min(1, 'Required').max(100),
    lastName: z.string().min(1, 'Required').max(100),
    email: z.email('Enter a valid email'),
    password: passwordComplexity,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Mirrors ChangePasswordDto (+ client-only confirm). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required').max(72),
    newPassword: passwordComplexity,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Mirrors ForgotPasswordDto. */
export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Mirrors ResetPasswordDto (token + complex password). */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is missing'),
    password: passwordComplexity,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
