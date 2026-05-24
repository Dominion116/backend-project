import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1).optional(),
  role: z.enum(['pregnant_woman', 'nurse', 'admin', 'researcher']).default('pregnant_woman'),
  language: z.enum(['en', 'yo', 'ha', 'ig']).default('en'),
  pregnancy_stage: z
    .enum(['first_trimester', 'second_trimester', 'third_trimester', 'postpartum'])
    .optional(),
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
