import { paginationSchema } from '@/shared/schemas/pagination'
import { PlatformEnum } from '@/features/social-medias/schemas'
import { z } from 'zod'

export enum FlagStatusEnum {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  NOT_APPLICABLE = 'not_applicable',
  IN_PROGRESS = 'in_progress',
}

export enum AffectedEntityTypeEnum {
  USER = 'users',
  SOCIAL_MEDIA = 'social-medias',
  ORGANIZATION = 'organization',
}

export enum FlagTypeEnum {
  MISSING_2FA = 'missing_2fa',
  OUTDATED_PASSWORD = 'outdated_password',
  INCOMPLETE_TRAINING = 'incomplete_training',
  UNACKNOWLEDGED_POLICIES = 'unacknowledged_policies',
  INACTIVE_ACCOUNT = 'inactive_account',
  NO_ASSIGNED_OWNER = 'no_assigned_owner',
  LEGAL_NOT_CONFIRMED = 'legal_not_confirmed',
  INCIDENT_OPEN = 'incident_open',
  SECURITY_RISK = 'security_risk',
  INCOMPLETE_OFFBOARDING = 'incomplete_offboarding',
  SECURITY_CONCERN = 'security_concern',
  OPERATIONAL_ISSUE = 'operational_issue',
  LOST_INACCESSIBLE_ACCOUNT = 'lost_inaccessible_account',
  OTHER = 'other',
}

export enum FlagSourceEnum {
  AUTOMATED_SYSTEM = 'automated',
  MANUAL_FLAG = 'manual',
}

export enum FlagHistoryActionsEnum {
  CREATED = 'created',
  STATUS_CHANGED = 'status_changed',
  COMMENT = 'comment',
}

const FlagStatus = z.nativeEnum(FlagStatusEnum)
const AffectedEntity = z.nativeEnum(AffectedEntityTypeEnum)
const FlagType = z.nativeEnum(FlagTypeEnum)

const accountUrlSchema = z.string().trim().url('Enter a valid account URL')

// Lost accounts are flagged by URL because they are not in the inventory yet.
export const createFlagSchema = z
  .object({
    flagType: FlagType,
    affectedEntityType: AffectedEntity.optional(),
    affectedEntity: z.string().optional(),
    accountUrl: z.string().optional(),
    accountPlatform: z.nativeEnum(PlatformEnum).optional(),
    accessIssue: z.string().optional(),
    organization: z.string().optional(),
    status: FlagStatus.optional(),
    source: z.string().optional(),
    description: z.string(),
    suggestedAction: z.string(),
    tenant: z.number().nullable().optional(),
    assignedTo: z.string().min(1, 'Assigned To is required'),
    dueDate: z.coerce.string().min(1, 'Due Date is required'),
  })
  .superRefine((data, ctx) => {
    const requireField = (path: keyof typeof data, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })

    if (data.flagType === FlagTypeEnum.LOST_INACCESSIBLE_ACCOUNT) {
      const urlResult = accountUrlSchema.safeParse(data.accountUrl ?? '')
      if (!urlResult.success) requireField('accountUrl', urlResult.error.issues[0].message)
      if (!data.accountPlatform) requireField('accountPlatform', 'Platform is required')
      if (!data.accessIssue?.trim()) requireField('accessIssue', 'Access Issue is required')
      return
    }

    if (!data.affectedEntityType) {
      requireField('affectedEntityType', 'Affected Entity Type is required')
    }
    if (!data.affectedEntity) requireField('affectedEntity', 'Affected entity is required')
  })

export const createFlagCommentSchema = z.object({
  flagId: z.number(),
  comment: z.string(),
})

export type CreateFlagFormSchema = z.infer<typeof createFlagSchema>
export type CreateFlagCommentSchema = z.infer<typeof createFlagCommentSchema>

export const flagsSearchSchema = paginationSchema.extend({
  flagType: z.array(z.string()).optional(),
  status: z.array(FlagStatus).optional(),
  organizations: z.array(z.string()).optional(),
  detectionDate: z
    .object({
      from: z.string().catch(''),
      to: z.string().catch(''),
    })
    .catch({ from: '', to: '' }),
  lastActivity: z
    .object({
      from: z.string().catch(''),
      to: z.string().catch(''),
    })
    .catch({ from: '', to: '' }),
  tenant: z.array(z.string()).optional(),
})
