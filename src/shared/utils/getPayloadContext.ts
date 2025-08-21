'use server'
import { getPayload } from 'payload'

export async function getPayloadContext() {
  const { default: config } = await import('@/lib/payload/payload.config')
  const payload = await getPayload({ config })
  return { payload }
}
