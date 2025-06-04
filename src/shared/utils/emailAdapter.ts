import { env } from '@/config/env'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

export function EmailAdapter() {
  return env.NEXT_PUBLIC_NODE_ENV === 'production'
    ? nodemailerAdapter({
        defaultFromAddress: env.FROM_ADDRESS,
        defaultFromName: env.FROM_NAME,
        transportOptions: {
          host: env.SMTP_HOST,
          port: 587,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        },
      })
    : nodemailerAdapter()
}
