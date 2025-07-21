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

export const userBaseSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password should have at least 8 characters'),
  name: z.string(),
  role: RoleEnum.optional(),
  status: StatusEnum.optional(),
  organizations: z.array(z.string()).optional(),
})

export const createUserFormSchema = userBaseSchema.superRefine((data, ctx) => {
  if (data.role !== UserRolesEnum.SuperAdmin) {
    if (!data.organizations || data.organizations.length === 0) {
      ctx.addIssue({
        path: ['organizations'],
        code: z.ZodIssueCode.custom,
        message: 'Organizations are required unless the role is Super Admin.',
      })
    }
  }
})

export const createFirstUserFormSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
})

export const updateUserFormSchema = userBaseSchema.omit({
  password: true,
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string(),
})

export const updateUserSchema = updateUserFormSchema.extend({ id: z.number() })

export const userSearchSchema = paginationSchema.extend({})

const responsibilitySchema = z.object({ responsibility: z.string() })
const policySchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  url: z.string().url(),
})

export const createWelcomeEmailSchema = z.object({
  instructions: z.string(),
  responsibilities: z.array(responsibilitySchema).optional(),
  policyLinks: z.array(policySchema).optional(),
})

export type WelcomeEmailSchema = z.infer<typeof createWelcomeEmailSchema>

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
