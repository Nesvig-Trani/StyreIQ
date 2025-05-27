import { Organization, User } from '@/payload-types'
import { paginationSchema } from '@/schemas/pagination'
import { z } from 'zod'

export const createSocialMediaFormSchema = z
  .object({
    name: z.string(),
    profileUrl: z.string().url(),
    platform: z.string(),
    contactEmail: z.string().email().or(z.literal('')).optional(),
    contactPhone: z.string().optional(),
    passwordUpdatedAt: z
      .preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) { const date = new Date(arg)
          return isNaN(date.getTime()) ? undefined : date
        }
        return undefined
      }, z.date())
      .optional(),
    isEnabledTwoFactor: z.boolean().optional(),
    isInUseSecurePassword: z.boolean().optional(),
    isAcceptedPolicies: z.boolean().optional(),
    isCompletedTrainingAccessibility: z.boolean().optional(),
    isCompletedTrainingRisk: z.boolean().optional(),
    isCompletedTrainingBrand: z.boolean().optional(),
    hasKnowledgeStandards: z.boolean().optional(),
    organization: z.string(),
    primaryAdmin: z.string(),
    backupAdmin: z.string(),
  })
  .refine(
    (data) => {
      return data.primaryAdmin !== data.backupAdmin
    },
    {
      message: "Fields 'Administrator' and 'Backup Administrator' must be differents.",
      path: ['backupAdmin'],
    },
  )

export enum SocialMediaStatusEnum {
  Active = 'active',
  Inactive = 'inactive',
  InTransition = 'in_transition',
  PendingApproval = 'pending_approval',
}

export const statusClassMap: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
}

export const statusLabelMap: Record<SocialMediaStatusEnum, string> = {
  [SocialMediaStatusEnum.Active]: 'Active',
  [SocialMediaStatusEnum.Inactive]: 'Inactive',
  [SocialMediaStatusEnum.InTransition]: 'In Transition',
  [SocialMediaStatusEnum.PendingApproval]: 'Pending Approval',
}

export const statusColorMap: Record<SocialMediaStatusEnum, string> = {
  [SocialMediaStatusEnum.Active]: 'green',
  [SocialMediaStatusEnum.Inactive]: 'red',
  [SocialMediaStatusEnum.InTransition]: 'yellow',
  [SocialMediaStatusEnum.PendingApproval]: 'yellow',
}

export type CreateSocialMediaFormProps = {
  users: User[]
  organizations: Organization[]
}

export const socialMediaSearchSchema = paginationSchema.extend({})
