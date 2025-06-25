import { z } from 'zod'
import { createEnv } from '@t3-oss/env-nextjs'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().min(1).url(),
    NEXT_PUBLIC_NODE_ENV: z.enum(['production', 'development', 'test']),
  },
  server: {
    SMTP_HOST: z.string(),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    FROM_ADDRESS: z.string(),
    FROM_NAME: z.string(),
  },

  runtimeEnv: {
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_NAME: process.env.FROM_NAME,
    FROM_ADDRESS: process.env.FROM_ADDRESS,
  },
})
