import { env } from '@/config/env'
import { CreateRoleRequestFormInput } from '@/features/role-request/schemas'

import { JSON_HEADERS } from '@/shared/constants'

export const createRoleRequest = async (data: CreateRoleRequestFormInput) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/role-requests`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create role request')
  }

  return response.json()
}

export const approveRoleRequest = async (id: number, approved: boolean, reviewNotes?: string) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/role-requests/${id}/approve`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ approved, reviewNotes }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to process role request')
  }

  return response.json()
}
