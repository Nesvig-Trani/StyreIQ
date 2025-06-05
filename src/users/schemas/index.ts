import { z } from 'zod'
import { paginationSchema } from '@/schemas/pagination'
import { Organization, User } from '@/payload-types'

export enum UserRolesEnum {
  SuperAdmin = 'super_admin',
  UnitAdmin = 'unit_admin',
  SocialMediaManager = 'social_media_manager',
}

export enum UserStatusEnum {
  Active = 'active',
  Inactive = 'inactive',
  PendingActivation = 'pending_activation',
  Rejected = 'rejected',
}

export const roleLabelMap: Record<UserRolesEnum, string> = {
  [UserRolesEnum.SuperAdmin]: 'Super Admin',
  [UserRolesEnum.UnitAdmin]: 'Unit Admin',
  [UserRolesEnum.SocialMediaManager]: 'Social Media Manager',
}

export const statusLabelMap: Record<UserStatusEnum, string> = {
  [UserStatusEnum.Active]: 'Active',
  [UserStatusEnum.Inactive]: 'Inactive',
  [UserStatusEnum.PendingActivation]: 'Pending Activation',
  [UserStatusEnum.Rejected]: 'Rejected',
}

const RoleEnum = z.nativeEnum(UserRolesEnum)
const StatusEnum = z.nativeEnum(UserStatusEnum)

export const createUserFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
  role: RoleEnum.optional(),
  status: StatusEnum.optional(),
  organizations: z.array(z.string()).optional(),
})

export const updateUserFormSchema = createUserFormSchema.omit({
  password: true,
})

export const updateUserSchema = updateUserFormSchema.extend({ id: z.number() })

export const userSearchSchema = paginationSchema.extend({})

export type CreateUser = z.infer<typeof createUserFormSchema>
export type CreateUserFormProps = {
  organizations: Organization[]
  user: User | null
}

export type UpdateUserFormProps = {
  id: string
  organizations: Organization[]
  data: User
}
