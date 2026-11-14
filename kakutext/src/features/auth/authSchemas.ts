import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(50, 'Display name must be 50 characters or fewer.')
    .optional(),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(72, 'Password must be 72 characters or fewer.'),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const recoverRequestSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
});

export type RecoverRequestValues = z.infer<typeof recoverRequestSchema>;

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'New password must be at least 8 characters long.')
      .max(72, 'New password must be 72 characters or fewer.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;