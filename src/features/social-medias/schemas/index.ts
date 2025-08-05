import { Organization, SocialMedia, User } from '@/lib/payload/payload-types'
import { paginationSchema } from '@/shared/schemas/pagination'
import { z } from 'zod'

const baseSocialMediaSchema = z.object({
  name: z.string(),
  profileUrl: z.string().url(),
  platform: z.string(),
  creationDate: z.string(),
  organization: z.string(),
  primaryAdmin: z.string(),
  adminContactEmails: z.array(z.string().email()),
  accountHandle: z.string().optional(),
  businessId: z.string().optional(),
  backupAdmin: z.string().optional(),
  backupContactInfo: z.string().email().optional(),
  contactEmail: z.string().email().or(z.literal('')).optional(),
  contactPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.literal(''))
    .optional(),
  thirdPartyManagement: z.string(),
  thirdPartyProvider: z.string().optional(),
  thirdPartyContact: z.string().optional(),
  passwordManagementPractice: z.string().optional(),
  linkedTools: z.array(z.string()).optional(),
  verificationStatus: z.string().optional(),
  platformSupportDetails: z.string().optional(),
  notes: z.string().optional(),
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

export const platformLabelMap: Record<PlatformEnum, string> = {
  [PlatformEnum.Facebook]: 'Facebook',
  [PlatformEnum.Instagram]: 'Instagram',
  [PlatformEnum.Twitter]: 'Twitter',
  [PlatformEnum.LinkedIn]: 'LinkedIn',
  [PlatformEnum.TikTok]: 'TikTok',
  [PlatformEnum.YouTube]: 'YouTube',
  [PlatformEnum.Other]: 'Other',
}

export const platformOptions = Object.values(PlatformEnum).map((platform) => ({
  value: platform,
  label: platformLabelMap[platform],
}))

export enum ThirdPartyManagementEnum {
  Yes = 'yes',
  No = 'no',
}

export const thirdPartyManagementLabelMap: Record<ThirdPartyManagementEnum, string> = {
  [ThirdPartyManagementEnum.Yes]: 'Yes',
  [ThirdPartyManagementEnum.No]: 'No',
}

export const thirdPartyManagementOptions = Object.values(ThirdPartyManagementEnum).map(
  (option) => ({
    value: option,
    label: thirdPartyManagementLabelMap[option],
  }),
)

export enum PasswordManagementPracticeEnum {
  PasswordManager = 'Password Manager',
  Manual = 'Manual',
  Other = 'Other',
}

export const passwordManagementPracticeLabelMap: Record<PasswordManagementPracticeEnum, string> = {
  [PasswordManagementPracticeEnum.PasswordManager]: 'Password Manager',
  [PasswordManagementPracticeEnum.Manual]: 'Manual',
  [PasswordManagementPracticeEnum.Other]: 'Other',
}

export const passwordManagementPracticeOptions = Object.values(PasswordManagementPracticeEnum).map(
  (practice) => ({
    value: practice,
    label: passwordManagementPracticeLabelMap[practice],
  }),
)

export enum LinkedToolsEnum {
  Hootsuite = 'Hootsuite',
  Canva = 'Canva',
  Sprout = 'Sprout',
  Other = 'Other',
}

export const linkedToolsLabelMap: Record<LinkedToolsEnum, string> = {
  [LinkedToolsEnum.Hootsuite]: 'Hootsuite',
  [LinkedToolsEnum.Canva]: 'Canva',
  [LinkedToolsEnum.Sprout]: 'Sprout',
  [LinkedToolsEnum.Other]: 'Other',
}

export const linkedToolsOptions = Object.values(LinkedToolsEnum).map((tool) => ({
  value: tool,
  label: linkedToolsLabelMap[tool],
}))

export enum VerificationStatusEnum {
  Verified = 'verified',
  NotVerified = 'notVerified',
  Pending = 'pending',
}

export const verificationStatusLabelMap: Record<VerificationStatusEnum, string> = {
  [VerificationStatusEnum.Verified]: 'Verified',
  [VerificationStatusEnum.NotVerified]: 'Not Verified',
  [VerificationStatusEnum.Pending]: 'Pending',
}

export const verificationStatusOptions = Object.values(VerificationStatusEnum).map((status) => ({
  value: status,
  label: verificationStatusLabelMap[status],
}))

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
