import { env } from '@/config/env'
import { CreateFlagCommentSchema, CreateFlagFormSchema } from '@/features/flags/schemas'
import { JSON_HEADERS } from '@/shared/constants'

export const createFlag = async (data: CreateFlagFormSchema) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/flags`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      flagType: data.flagType,
      affectedEntityType: data.affectedEntityType,
      affectedEntity: data.affectedEntity,
      description: data.description,
      suggestedAction: data.suggestedAction,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create flag')
  }

  return response.json()
}

export const markFlagAsResolved = async (id: number) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/flags/resolved/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to create organization')
  }

  return response.json()
}

export const getFlagHistory = async (id: number) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/flagHistory?where[flag][equals]=${id}&sort=createdAt`,
    {
      method: 'GET',
      headers: JSON_HEADERS,
      credentials: 'include',
    },
  )

  if (!response.ok) {
    throw new Error('Failed to get flag history')
  }

  return response.json()
}

export const createComment = async (data: CreateFlagCommentSchema) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/flagComments`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      ...data,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get flag history')
  }

  return response.json()
}

export const getComments = async (id: number) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/flagComments?where[flag][equals]=${id}&sort=createdAt`,
    {
      method: 'GET',
      headers: JSON_HEADERS,
      credentials: 'include',
    },
  )

  if (!response.ok) {
    throw new Error('Failed to get flag history')
  }

  return response.json()
}
