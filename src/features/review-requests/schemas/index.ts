import { z } from 'zod'

export const setUserStatusSchema = z
  .object({
    id: z.number(),
    approved: z.boolean(),
    reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.approved && !data.reason?.trim()) {
      ctx.addIssue({
        path: ['reason'],
        code: z.ZodIssueCode.custom,
        message: 'Reason is required when approved is false.',
      })
    }
  })

export interface RejectApplicationButtonProps {
  id: number
}
