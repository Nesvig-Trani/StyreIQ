import { APIError, PayloadEmailAdapter, SendEmailOptions } from 'payload'
import { env } from '@/config/env'

const RESEND_SEND_EMAIL_URL = 'https://api.resend.com/emails'

// Resend queues every send and does not keep the order between sends, so a caller that
// needs one email to arrive after another must schedule the later one (ISO 8601 date).
export type ScheduledEmailOptions = SendEmailOptions & {
  scheduledAt?: string
}

type ResendAddress = string | string[]

type ResendSendEmailBody = {
  from: string
  to: ResendAddress
  cc: ResendAddress
  bcc: ResendAddress
  reply_to: ResendAddress
  subject: string
  html: string
  text: string
  scheduled_at?: string
}

type ResendSendEmailResponse = { id: string }

type ResendErrorResponse = { statusCode?: number; name?: string; message?: string }

export function EmailAdapter(): PayloadEmailAdapter<ResendSendEmailResponse> {
  return () => ({
    name: 'resend-rest',
    defaultFromAddress: env.FROM_ADDRESS,
    defaultFromName: env.FROM_NAME,
    sendEmail: async (message) => {
      const res = await fetch(RESEND_SEND_EMAIL_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toResendBody(message)),
      })
      const data: unknown = await res.json()

      if (isResendSuccess(data)) {
        return data
      }

      const error: ResendErrorResponse = isRecord(data) ? data : {}
      const statusCode = error.statusCode || res.status
      const detail = error.name && error.message ? ` ${error.name} - ${error.message}` : ''
      throw new APIError(`Error sending email: ${statusCode}${detail}`, statusCode)
    },
  })
}

function toResendBody(message: SendEmailOptions): ResendSendEmailBody {
  const body: ResendSendEmailBody = {
    from: mapFromAddress(message.from),
    to: mapAddresses(message.to),
    cc: mapAddresses(message.cc),
    bcc: mapAddresses(message.bcc),
    reply_to: mapAddresses(message.replyTo),
    subject: message.subject ?? '',
    html: message.html?.toString() || '',
    text: message.text?.toString() || '',
  }

  if ('scheduledAt' in message && typeof message.scheduledAt === 'string') {
    body.scheduled_at = message.scheduledAt
  }

  return body
}

function mapFromAddress(address: SendEmailOptions['from']): string {
  if (!address) {
    return `${env.FROM_NAME} <${env.FROM_ADDRESS}>`
  }
  if (typeof address === 'string') {
    return address
  }
  return `${address.name} <${address.address}>`
}

function mapAddresses(addresses: SendEmailOptions['to']): ResendAddress {
  if (!addresses) {
    return ''
  }
  if (typeof addresses === 'string') {
    return addresses
  }
  if (Array.isArray(addresses)) {
    return addresses.map((address) => (typeof address === 'string' ? address : address.address))
  }
  return [addresses.address]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isResendSuccess(value: unknown): value is ResendSendEmailResponse {
  return isRecord(value) && typeof value.id === 'string'
}
