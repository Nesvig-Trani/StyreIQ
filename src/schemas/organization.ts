import { z } from 'zod'

export const createOrgFormSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['university', 'faculty', 'department', 'office', 'project']),
  parent: z.string().optional(),
  admin: z.string().optional(),
  backupAdmins: z.string().array().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_review']),
  description: z.string().optional(),
  delegatedPermissions: z.boolean().optional(),
})
