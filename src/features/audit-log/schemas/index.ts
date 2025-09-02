import { z } from 'zod'
import { paginationSchema } from '@/shared/schemas/pagination'

export const auditLogSearchSchema = paginationSchema.extend({
  entity: z.array(z.string()).catch([]),
  action: z.array(z.string()).catch([]),
  user: z.string().catch(''),
  createdAt: z
    .object({
      from: z.string().catch(''),
      to: z.string().catch(''),
    })
    .catch({ from: '', to: '' }),
  userDocumentId: z.number().optional(),
  organizationDocumentId: z.number().optional(),
  socialMediaDocumentId: z.number().optional(),
})
