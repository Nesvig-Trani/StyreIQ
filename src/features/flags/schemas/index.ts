import { paginationSchema } from '@/shared/schemas/pagination'
import { z } from 'zod'

export enum FlagStatusEnum {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  NOT_APPLICABLE = 'not_applicable',
}

export enum AffectedEntityTypeEnum {
  USER = 'users',
  SOCIAL_MEDIA = 'social-medias',
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

export const createFlagSchema = z.object({
  flagType: FlagType,
  affectedEntityType: AffectedEntity,
  affectedEntity: z.string(),
  organization: z.string().optional(),
  status: FlagStatus.optional(),
  source: z.string().optional(),
  description: z.string(),
  suggestedAction: z.string(),
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
})
