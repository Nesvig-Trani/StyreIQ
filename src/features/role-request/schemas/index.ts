import { z } from 'zod'
import { UserRolesEnum } from '@/features/users/schemas'

export const createRoleRequestFormSchema = z.object({
  requestedRole: z.nativeEnum(UserRolesEnum),
  organization: z.string().min(1, 'Organization is required'),
  justification: z
    .string()
    .min(20, 'Justification must be at least 20 characters')
    .max(500, 'Justification must be at most 500 characters'),
})

export type CreateRoleRequestFormInput = z.infer<typeof createRoleRequestFormSchema>

export const roleRequestStatusEnum = z.enum(['pending', 'approved', 'rejected'])
export type RoleRequestStatus = z.infer<typeof roleRequestStatusEnum>

export const roleRequestSearchSchema = z.object({
  status: roleRequestStatusEnum.optional(),
  pagination: z.object({
    pageSize: z.number().default(10),
    pageIndex: z.number().default(0),
  }),
})

export type RoleRequestSearchSchema = z.infer<typeof roleRequestSearchSchema>
