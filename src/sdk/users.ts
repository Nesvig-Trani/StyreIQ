import { z } from 'zod'
import { createFirstUserFormSchema, createUserFormSchema, updateUserSchema } from '@/users'
import { env } from '@/config/env'
import { updateOrgAccessSchema } from '@/organization-access'
import { setUserStatusSchema } from '@/review-requests'
import { JSON_HEADERS } from '@/shared/constants'

/**
 * Makes a request to the api for creating a user for the first time.
 * @param data
 * @returns
 */
export const createFirstUser = async (data: z.infer<typeof createFirstUserFormSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/create-first-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
    }),
  })

  if (!response.ok) {
    const errorResponse = await response.json()

    throw {
      message: 'Failed to create user',
      data: { message: errorResponse.message, details: errorResponse.details },
    }
  }

  return response.json()
}

export const createUser = async (data: z.infer<typeof createUserFormSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      status: data.status,
      organizations: data.organizations,
    }),
  })

  if (!response.ok) {
    const errorResponse = await response.json()

    throw {
      message: 'Failed to create user',
      data: { message: errorResponse.message, details: errorResponse.details },
    }
  }

  return response.json()
}

export const updateUser = async (data: z.infer<typeof updateUserSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      organizations: data.organizations,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw {
      message: errorData?.error || 'Failed to update user',
      status: response.status,
      data: errorData,
    }
  }

  return response.json()
}

export const updateUserAccess = async (data: z.infer<typeof updateOrgAccessSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/access`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      access: data.access,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update user')
  }

  return await response.json()
}

export const logout = async ({ cookie }: { cookie: string }) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...JSON_HEADERS,
      cookie,
    },
  })
  return response.json()
}

export const setUserApprovalStatus = async ({
  data,
}: {
  data: z.infer<typeof setUserStatusSchema>
}) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/status`, {
    method: 'PUT',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ ...data }),
  })

  if (!response.ok) {
    throw new Error('Failed to set user status')
  }

  return response.json()
}
