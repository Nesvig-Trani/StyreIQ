import { z } from 'zod'
import { paginationSchema } from '@/shared/schemas/pagination'
import { Organization, User } from '@/types/payload-types'
import { UserRolesEnum, UserStatusEnum } from '@/shared/constants/user-roles'
export { UserRolesEnum, UserStatusEnum }

export const roleLabelMap: Record<UserRolesEnum, string> = {
  [UserRolesEnum.SuperAdmin]: 'Super Admin',
  [UserRolesEnum.UnitAdmin]: 'Unit Admin',
  [UserRolesEnum.SocialMediaManager]: 'Social Media Manager',
  [UserRolesEnum.CentralAdmin]: 'Central Admin',
}

export const statusLabelMap: Record<UserStatusEnum, string> = {
  [UserStatusEnum.Active]: 'Active',
  [UserStatusEnum.Inactive]: 'Inactive',
  [UserStatusEnum.PendingActivation]: 'Pending Activation',
  [UserStatusEnum.Rejected]: 'Rejected',
}

export const statusColorMap: Record<UserStatusEnum, string> = {
  [UserStatusEnum.Active]: 'green',
  [UserStatusEnum.Inactive]: 'red',
  [UserStatusEnum.PendingActivation]: 'yellow',
  [UserStatusEnum.Rejected]: 'red',
}

export const statusClassMap: Record<string, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const RoleEnum = z.nativeEnum(UserRolesEnum)
const StatusEnum = z.nativeEnum(UserStatusEnum)

const validateUserRoles = (
  data: {
    roles: UserRolesEnum[]
    organizations?: unknown[]
  },
  ctx: z.RefinementCtx,
) => {
  const hasSuperAdmin = data.roles.includes(UserRolesEnum.SuperAdmin)
  const hasOtherRoles = data.roles.some((role) => role !== UserRolesEnum.SuperAdmin)

  if (hasSuperAdmin && hasOtherRoles) {
    ctx.addIssue({
      path: ['roles'],
      code: z.ZodIssueCode.custom,
      message: 'Super Admin cannot be combined with other roles.',
    })
  }

  if (!hasSuperAdmin) {
    if (!data.organizations || data.organizations.length === 0) {
      ctx.addIssue({
        path: ['organizations'],
        code: z.ZodIssueCode.custom,
        message: 'Unit is required unless the user is Super Admin.',
      })
    }
  }
}

export const userBaseSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: 'Password should have at least 8 characters',
    }),
  name: z.string(),
  status: StatusEnum.optional(),
  organizations: z.array(z.string()).optional(),
  passwordUpdatedAt: z
    .preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) {
        const date = new Date(arg)
        return isNaN(date.getTime()) ? undefined : date
      }
      return undefined
    }, z.date())
    .optional(),
  tenant: z.number().nullable().optional(),
  active_role: RoleEnum.optional(),
  roles: z.array(RoleEnum).min(1, 'At least one role is required'),
})

export const createUserFormSchema = userBaseSchema
  .omit({ active_role: true })
  .superRefine(validateUserRoles)

export const createFirstUserFormSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
})

export const updateUserFormSchema = userBaseSchema
  .omit({ password: true })
  .superRefine(validateUserRoles)

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string(),
})

export const updateUserSchema = z.intersection(updateUserFormSchema, z.object({ id: z.number() }))

export const userSearchSchema = paginationSchema.extend({
  tenant: z.coerce.string().optional(),
})

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
