import { z } from 'zod'
import { UserRolesEnum, UserStatusEnum } from '@/types/users'

const RoleEnum = z.nativeEnum(UserRolesEnum)
const StatusEnum = z.nativeEnum(UserStatusEnum)

export const createUserFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
  role: RoleEnum.optional(),
  status: StatusEnum.optional(),
  organization: z.string().optional(),
})

export const updateUserFormSchema = createUserFormSchema.omit({
  password: true,
})
