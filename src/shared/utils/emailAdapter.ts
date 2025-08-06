import { env } from '@/config/env'
import { resendAdapter } from '@payloadcms/email-resend'

export function EmailAdapter() {
  return resendAdapter({
    defaultFromAddress: env.FROM_ADDRESS,
    defaultFromName: env.FROM_NAME,
    apiKey: env.RESEND_API_KEY || '',
  })
}
