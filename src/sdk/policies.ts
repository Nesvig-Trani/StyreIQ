import { JSON_HEADERS } from '@/shared/constants'
import { env } from '@/config/env'

export const savePolicy = async ({ data }: { data: any }) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/policies`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({text: data}),
  })

  if (!response.ok) {
    throw new Error('Failed to create organization')
  }

  return response.json()
}

export const acceptPolicy = async ({ policy }: { policy: number}) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/acknowledgments`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({policy}),
  })

  if (!response.ok) {
    throw new Error('Failed to create organization')
  }

  return response.json()
}
