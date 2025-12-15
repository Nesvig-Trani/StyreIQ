import { JSON_HEADERS } from '@/shared/constants'
import { env } from '@/config/env'

export const savePolicy = async ({ data, tenant }: { data: unknown; tenant?: number | null }) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/policies`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      text: data,
      tenant: tenant,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create policy')
  }

  return response.json()
}

export const acceptPolicy = async ({
  policy,
  tenant,
}: {
  policy: number
  tenant?: number | null
}) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/acknowledgments`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      policy,
      tenant: tenant,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to save policy')
  }

  return response.json()
}
