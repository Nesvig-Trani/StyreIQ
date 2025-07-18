'use server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function getPayloadContext() {
  const payload = await getPayload({ config })
  return { payload }
}
