import { z } from 'zod'

export const paginationSchema = z.object({
  pagination: z
    .object({
      pageIndex: z.coerce.number().int().nonnegative().catch(0),
      pageSize: z.coerce.number().int().positive().catch(10),
    })
    .default({ pageIndex: 0, pageSize: 10 }),
})
