import { z } from 'zod'
import { createEnv } from '@t3-oss/env-nextjs'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().min(1).url(),
    NEXT_PUBLIC_NODE_ENV: z.enum(['production', 'development', 'test']),
  },
  server: {
    FROM_ADDRESS: z.string(),
    FROM_NAME: z.string(),
    PAYLOAD_SECRET: z.string(),
    RESEND_API_KEY: z.string(),
    LOCAL_EMAIL_TO_ADDRESS: z.string(),
  },

  runtimeEnv: {
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || 'development',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    FROM_NAME: process.env.FROM_NAME,
    FROM_ADDRESS: process.env.FROM_ADDRESS,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LOCAL_EMAIL_TO_ADDRESS: process.env.LOCAL_EMAIL_TO_ADDRESS,
  },
})
