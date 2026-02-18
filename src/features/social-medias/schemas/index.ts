import { Organization, SocialMedia, User } from '@/types/payload-types'
import { paginationSchema } from '@/shared/schemas/pagination'
import { z } from 'zod'

const baseSocialMediaSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  profileUrl: z.string().min(1, 'Profile URL is required').url('Invalid URL format'),
  platform: z.string().min(1, 'Platform is required'),
  creationDate: z.string().min(1, 'Creation date is required'),
  organization: z.string().min(1, 'Organization is required'),
  primaryAdmin: z.string().min(1, 'Primary admin is required'),
  adminContactEmails: z
    .array(z.string().email())
    .min(1, 'At least one admin contact email is required'),
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
  thirdPartyManagement: z.string().min(1, 'Third party management is required'),
  thirdPartyProvider: z.string().optional(),
  thirdPartyContact: z.string().optional(),
  passwordManagementPractice: z.string().min(1, 'Password management practice is required'),
  linkedTools: z.array(z.string()).optional(),
  verificationStatus: z.string().optional(),
  platformSupportDetails: z.string().optional(),
  socialMediaManagers: z.array(z.string()).min(1, 'At least one social media manager is required'),
  notes: z.string().optional(),
  tenant: z.number().nullable().optional(),
})

export const createSocialMediaFormSchema = baseSocialMediaSchema.refine(
  (data) => {
    if (!data.backupAdmin) return true
    return data.primaryAdmin !== data.backupAdmin
  },
  {
    message: "Fields 'Administrator' and 'Backup Administrator' must be different.",
    path: ['backupAdmin'],
  },
)

export const updateSocialMediaFormSchema = baseSocialMediaSchema
  .omit({ tenant: true })
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
  ManagedInternally = 'no_managed_internally',
  ManagedExternally = 'yes_managed_externally',
}

export const thirdPartyManagementLabelMap: Record<ThirdPartyManagementEnum, string> = {
  [ThirdPartyManagementEnum.ManagedInternally]: 'No – Managed internally',
  [ThirdPartyManagementEnum.ManagedExternally]: 'Yes – Managed by external agency/vendor',
}

export const thirdPartyManagementOptions = Object.values(ThirdPartyManagementEnum).map(
  (option) => ({
    value: option,
    label: thirdPartyManagementLabelMap[option],
  }),
)

export enum PasswordManagementPracticeEnum {
  PasswordManager = 'password_manager_shared',
  SharedManual = 'shared_manual',
  IndividualLogins = 'individual_logins',
  Other = 'other',
}

export const passwordManagementPracticeLabelMap: Record<PasswordManagementPracticeEnum, string> = {
  [PasswordManagementPracticeEnum.PasswordManager]: 'Password Manager (shared via approved tool)',
  [PasswordManagementPracticeEnum.SharedManual]: 'Shared/Manual (no password manager)',
  [PasswordManagementPracticeEnum.IndividualLogins]: 'Individual logins only (no shared password)',
  [PasswordManagementPracticeEnum.Other]: 'Other',
}

export const passwordManagementPracticeOptions = Object.values(PasswordManagementPracticeEnum).map(
  (practice) => ({
    value: practice,
    label: passwordManagementPracticeLabelMap[practice],
  }),
)

export enum LinkedToolsEnum {
  Hootsuite = 'hootsuite',
  SproutSocial = 'sprout_social',
  Buffer = 'buffer',
  Later = 'later',
  Agorapulse = 'agorapulse',
  Sprinklr = 'sprinklr',
  MetaBusinessManager = 'meta_business_manager',
  LinkedInBusinessManager = 'linkedin_business_manager',
  TikTokBusinessCenter = 'tiktok_business_center',
  XAdsManager = 'x_ads_manager',
  YouTubeStudio = 'youtube_studio',
  Other = 'other',
}

export const linkedToolsLabelMap: Record<LinkedToolsEnum, string> = {
  [LinkedToolsEnum.Hootsuite]: 'Hootsuite',
  [LinkedToolsEnum.SproutSocial]: 'Sprout Social',
  [LinkedToolsEnum.Buffer]: 'Buffer',
  [LinkedToolsEnum.Later]: 'Later',
  [LinkedToolsEnum.Agorapulse]: 'Agorapulse',
  [LinkedToolsEnum.Sprinklr]: 'Sprinklr',
  [LinkedToolsEnum.MetaBusinessManager]: 'Meta Business Manager / Business Suite',
  [LinkedToolsEnum.LinkedInBusinessManager]: 'LinkedIn Business Manager',
  [LinkedToolsEnum.TikTokBusinessCenter]: 'TikTok Business Center',
  [LinkedToolsEnum.XAdsManager]: 'X (Twitter) Business / Ads Manager',
  [LinkedToolsEnum.YouTubeStudio]: 'YouTube Studio',
  [LinkedToolsEnum.Other]: 'Other (please specify in notes)',
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
  currentUser: User | null
  selectedTenantId: number | null
}

export type UpdateSocialMediaFormProps = {
  data: SocialMedia
  user: User | null
} & Omit<CreateSocialMediaFormProps, 'selectedTenantId'>

export const socialMediaSearchSchema = paginationSchema.extend({
  status: z.array(z.nativeEnum(SocialMediaStatusEnum)).optional(),
  platform: z.array(z.string()).optional(),
  organization: z.array(z.string()).optional(),
  primaryAdmin: z.array(z.string()).optional(),
  hasSecurePassword: z.boolean().optional(),
  hasTwoFactor: z.boolean().optional(),
  tenant: z.array(z.string()).optional(),
})

export type UpdateSocialMedia = z.infer<typeof createSocialMediaFormSchema>
