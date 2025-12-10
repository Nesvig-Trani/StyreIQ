import { paginationSchema } from '@/shared/schemas/pagination'
import { z } from 'zod'

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
  adminContact: z.string().email('Invalid email address'),
  timezone: z
    .enum(['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'])
    .default('America/New_York'),
  notes: z.string().optional(),
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
})

export type TenantGovernanceSettingsSchema = z.infer<typeof tenantGovernanceSettingsSchema>
