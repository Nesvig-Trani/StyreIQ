import { paginationSchema } from '@/shared/schemas/pagination'
import { z } from 'zod'

export const SELECTED_TENANT_COOKIE_NAME = 'styreiq_selected_tenant'
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
export const tenantSearchSchema = paginationSchema.extend({
  tenantId: z.array(z.coerce.number()).optional(),
})

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/,
      'Invalid domain format (e.g., example.edu)',
    ),
  adminContactName: z.string().min(1, 'Admin contact name is required'),
  adminContactEmail: z.string().email('Invalid email address'),
  timezone: z
    .enum(['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'])
    .default('America/New_York'),
  notes: z.string().optional(),
  enabledTrainings: z
    .array(
      z.object({
        trainingId: z.enum(['training-governance', 'training-risk', 'training-leadership']),
        assignedRoles: z.array(z.enum(['social_media_manager', 'unit_admin', 'central_admin'])),
      }),
    )
    .default([
      {
        trainingId: 'training-governance',
        assignedRoles: ['social_media_manager', 'unit_admin'],
      },
      {
        trainingId: 'training-risk',
        assignedRoles: ['social_media_manager', 'unit_admin'],
      },
      {
        trainingId: 'training-leadership',
        assignedRoles: ['unit_admin'],
      },
    ]),
})

export type CreateTenantFormSchema = z.infer<typeof createTenantSchema>

export const tenantGovernanceSettingsSchema = z.object({
  policyReminderDays: z
    .array(
      z.object({
        day: z.coerce.number().min(1).max(90),
      }),
    )
    .min(1)
    .max(5),
  trainingEscalationDays: z
    .array(
      z.object({
        day: z.coerce.number().min(1).max(180),
      }),
    )
    .min(1)
    .max(5),

  rollCallFrequency: z.enum(['monthly', 'quarterly', 'semiannual', 'annual']),
  passwordRotationDays: z.coerce.number().min(30).max(365),
  userPasswordCadenceDays: z.coerce.number().min(30).max(365),
  sharedPasswordCadenceDays: z.coerce.number().min(30).max(365),
})

export type TenantGovernanceSettingsSchema = z.infer<typeof tenantGovernanceSettingsSchema>
