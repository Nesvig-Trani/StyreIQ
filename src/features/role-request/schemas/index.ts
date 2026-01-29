import { z } from 'zod'
import { UserRolesEnum } from '@/features/users/schemas'
import { paginationSchema } from '@/shared/schemas/pagination'

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

export const roleRequestSearchSchema = paginationSchema.extend({
  status: z.array(roleRequestStatusEnum).optional(),
  tenant: z.array(z.string()).optional(),
})

export type RoleRequestSearchSchema = z.infer<typeof roleRequestSearchSchema>
