import { Organization, SocialMedia, User } from '@/payload-types'
import { paginationSchema } from '@/schemas/pagination'
import { z } from 'zod'

const baseSocialMediaSchema = z.object({
  name: z.string(),
  profileUrl: z.string().url(),
  platform: z.string(),
  contactEmail: z.string().email().or(z.literal('')).optional(),
  contactPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.literal(''))
    .optional(),
  organization: z.string(),
  primaryAdmin: z.string(),
  backupAdmin: z.string(),
})

export const createSocialMediaFormSchema = baseSocialMediaSchema.refine(
  (data) => data.primaryAdmin !== data.backupAdmin,
  {
    message: "Fields 'Administrator' and 'Backup Administrator' must be different.",
    path: ['backupAdmin'],
  },
)

export const updateSocialMediaFormSchema = baseSocialMediaSchema
  .extend({
    id: z.number(),
  })
  .refine((data) => data.primaryAdmin !== data.backupAdmin, {
    message: "Fields 'Administrator' and 'Backup Administrator' must be different.",
    path: ['backupAdmin'],
  })

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

export const statusOptions = Object.values(SocialMediaStatusEnum).map((status) => ({
  label: statusLabelMap[status],
  value: status,
}))

export enum PlatformEnum {
  Facebook = 'facebook',
  Instagram = 'instagram',
  Twitter = 'twitter',
  LinkedIn = 'linkedin',
  TikTok = 'tiktok',
  YouTube = 'youtube',
  Other = 'other',
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

export type UpdateSocialMediaFormProps = {
  data: SocialMedia
  user: User | null
} & CreateSocialMediaFormProps

export const socialMediaSearchSchema = paginationSchema.extend({
  status: z.array(z.nativeEnum(SocialMediaStatusEnum)).optional(),
  platform: z.array(z.string()).optional(),
  organization: z.array(z.string()).optional(),
  primaryAdmin: z.array(z.string()).optional(),
  hasSecurePassword: z.boolean().optional(),
  hasTwoFactor: z.boolean().optional(),
})

export type UpdateSocialMedia = z.infer<typeof createSocialMediaFormSchema>
