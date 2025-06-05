import { z } from 'zod'
import { createUserFormSchema, updateUserSchema } from '@/users/schemas'
import { env } from '@/config/env'
import { updateOrgAccessSchema } from '@/organization-access'
import { setUserStatusSchema } from '@/review-requests'

export const createUser = async (data: z.infer<typeof createUserFormSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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

export const getUsers = async ({
  params,
  cookie,
}: {
  params: {
    page: string
    limit: string
  }
  cookie: string
}) => {
  const search = new URLSearchParams(params as Record<string, string>)
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users?${search}`, {
    credentials: 'include',
    headers: {
      cookie: cookie,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get users')
  }

  return response.json()
}

export const updateUserAccess = async (data: z.infer<typeof updateOrgAccessSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/access`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
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
    const req = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
    })
    return req.json()
}
export const setUserApprovalStatus = async ({
  data,
}: {
  data: z.infer<typeof setUserStatusSchema>
}) => {
  const req = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/status`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data }),
  })

  if (!req.ok) {
    throw new Error('Failed to set user status')
  }

  return req.json()
}
