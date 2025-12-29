import { z } from 'zod'

export enum ComplianceTaskType {
  PASSWORD_SETUP = 'PASSWORD_SETUP',
  POLICY_ACKNOWLEDGMENT = 'POLICY_ACKNOWLEDGMENT',
  TRAINING_COMPLETION = 'TRAINING_COMPLETION',
  USER_ROLL_CALL = 'USER_ROLL_CALL',
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
