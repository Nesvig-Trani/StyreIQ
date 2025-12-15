import { z } from 'zod'
import {
  createFirstUserFormSchema,
  createUserFormSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
  WelcomeEmailSchema,
} from '@/features/users'
import { env } from '@/config/env'
import { updateUnitAccessSchema } from '@/features/units'
import { setUserStatusSchema } from '@/features/review-requests'
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
      tenant: data.tenant,
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
      passwordUpdatedAt: data.passwordUpdatedAt,
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

export const updateUserAccess = async (data: z.infer<typeof updateUnitAccessSchema>) => {
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

export const sendForgotPasswordRequest = async (data: z.infer<typeof forgotPasswordSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ ...data }),
  })

  if (!response.ok) {
    throw new Error('Failed to send forgot password email instructions')
  }

  return response.json()
}

export const resetPasswordRequest = async (data: z.infer<typeof resetPasswordSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/users/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ ...data }),
  })

  if (!response.ok) {
    throw new Error('Failed to reset password')
  }

  return response.json()
}

export const createWelcomeEmail = async (data: WelcomeEmailSchema) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/welcome-emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
    }),
  })

  if (!response.ok) {
    const errorResponse = await response.json()

    throw {
      message: 'Failed to create welcome email',
      data: { message: errorResponse.message, details: errorResponse.details },
    }
  }

  return response.json()
}
