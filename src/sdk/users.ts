import { z } from 'zod'
import { createUserFormSchema, updateOrgAccessSchema, updateUserFormSchema, updateUserSchema } from '@/users'
import { env } from '@/config/env'

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

  return await response.json()
}

export const updateUser = async (data: z.infer<typeof updateUserSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/${data.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      organizations: data.organizations,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update user')
  }

  return await response.json()
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

  return await response.json()
}

export const updateUserAccess = async (data: z.infer<typeof updateOrgAccessSchema>) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/users/access`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        access: data.access,
      }),
    },
  )

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
      cookie
    },
  })
  return await req.json()
}
