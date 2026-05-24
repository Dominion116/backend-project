import { z } from 'zod';

// Only the three roles a user can self-select at registration.
// 'admin' is assigned internally via PATCH /api/admin/users/:id/role.
export const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1).max(120).optional(),
  role: z.enum(['pregnant_woman', 'nurse', 'researcher']).default('pregnant_woman'),
  phone_number: z.string().max(20).optional(),
  // language and pregnancy_stage are set during the onboarding flow via PATCH /profile
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
