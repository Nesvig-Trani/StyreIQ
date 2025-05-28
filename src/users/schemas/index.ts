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
  PendingActivation = 'pending_activation',
}

export const roleLabelMap: Record<UserRolesEnum, string> = {
  [UserRolesEnum.SuperAdmin]: 'Super Admin',
  [UserRolesEnum.UnitAdmin]: 'Unit Admin',
  [UserRolesEnum.SocialMediaManager]: 'Social Media Manager',
}

export const statusLabelMap: Record<UserStatusEnum, string> = {
  [UserStatusEnum.Active]: 'Active',
  [UserStatusEnum.PendingActivation]: 'Pending Activation',
}

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

export const userSearchSchema = paginationSchema.extend({})

export type CreateUserFormProps = {
  organizations: Organization[]
}

export type UpdateUserFormProps = {
  id: string
  organizations: Organization[]
  data: User
}
