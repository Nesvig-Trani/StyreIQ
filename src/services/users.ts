import { z } from 'zod'
import { createUserFormSchema, updateUserFormSchema } from '@/schemas/users'
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
      organization: data.organization,
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

export const updateUser = async (id: string, data: z.infer<typeof updateUserFormSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/${id}`, {
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
      organization: Number(data.organization),
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update user')
  }

  return await response.json()
}
