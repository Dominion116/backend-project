import { z } from 'zod';

export const AdminPaginationDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const AdminUsersQueryDto = AdminPaginationDto.extend({
  role: z.enum(['pregnant_woman', 'nurse', 'admin', 'researcher']).optional(),
});

export const AdminConversationsQueryDto = AdminPaginationDto.extend({
  flagged: z.coerce.boolean().optional(),
  user_id: z.string().uuid().optional(),
});

export const UpdateRoleDto = z.object({
  role: z.enum(['pregnant_woman', 'nurse', 'admin', 'researcher']),
});

export type AdminUsersQueryDtoType = z.infer<typeof AdminUsersQueryDto>;
export type AdminConversationsQueryDtoType = z.infer<typeof AdminConversationsQueryDto>;
export type UpdateRoleDtoType = z.infer<typeof UpdateRoleDto>;
