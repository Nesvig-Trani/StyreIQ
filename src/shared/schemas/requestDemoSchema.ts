import { z } from 'zod'

export const requestDemoSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  company: z.string().trim().optional(),
  role: z.string().trim().optional(),
})

export type RequestDemoInput = z.infer<typeof requestDemoSchema>
