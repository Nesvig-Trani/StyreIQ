import { z } from 'zod'

export enum ComplianceTaskType {
  PASSWORD_SETUP = 'PASSWORD_SETUP',
  CONFIRM_USER_PASSWORD = 'CONFIRM_USER_PASSWORD',
  CONFIRM_SHARED_PASSWORD = 'CONFIRM_SHARED_PASSWORD',
  CONFIRM_2FA = 'CONFIRM_2FA',
  POLICY_ACKNOWLEDGMENT = 'POLICY_ACKNOWLEDGMENT',
  TRAINING_COMPLETION = 'TRAINING_COMPLETION',
  USER_ROLL_CALL = 'USER_ROLL_CALL',
  REVIEW_FLAG = 'REVIEW_FLAG',
}

export enum ComplianceTaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  ESCALATED = 'ESCALATED',
}

export const passwordSetupSchema = z.object({
  passwordConfirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm secure password setup',
  }),
  twoFactorConfirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm 2FA setup',
  }),
})

export type PasswordSetupFormData = z.infer<typeof passwordSetupSchema>

export const trainingSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm training completion',
  }),
})

export type TrainingFormData = z.infer<typeof trainingSchema>

export const twoFactorSchema = z.object({
  confirmation: z.boolean().refine((val) => val === true, {
    message: 'You must confirm 2FA is enabled',
  }),
})

export const sharedPasswordSchema = z.object({
  confirmation: z.boolean().refine((val) => val === true, {
    message: 'You must confirm shared password update',
  }),
})

export const userPasswordSchema = z.object({
  confirmation: z.boolean().refine((val) => val === true, {
    message: 'You must confirm password update',
  }),
})

export const flagResolutionSchema = z.object({
  resolutionSummary: z.string().min(10, 'Please provide a detailed resolution summary'),
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm that you have reviewed this risk flag',
  }),
})

export type FlagResolutionFormData = z.infer<typeof flagResolutionSchema>
