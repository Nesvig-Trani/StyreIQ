import {
  createSocialMediaFormSchema,
  SocialMediaStatusEnum,
  updateSocialMediaFormSchema,
} from '@/social-medias'
import { z } from 'zod'
import { env } from '@/config/env'
import { EndpointError } from '@/shared'
import { JSON_HEADERS } from '@/shared/constants'

/**
 * Creates a new social media.
 * @param data
 * @returns
 */
export const createSocialMedia = async (data: z.infer<typeof createSocialMediaFormSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/social-medias`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      profileUrl: data.profileUrl,
      platform: data.platform,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      organization: data.organization,
      primaryAdmin: data.primaryAdmin,
      backupAdmin: data.backupAdmin,
    }),
  })

  const dataResponse = await response.json()
  if (!response.ok) {
    if (dataResponse?.error) {
      throw new EndpointError(dataResponse.error, response.status)
    }
    throw new Error('Failed to create a social media')
  }

  return dataResponse
}

/**
 * Creates a new social media.
 * @param data
 * @returns
 */
export const updateSocialMedia = async (data: z.infer<typeof updateSocialMediaFormSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/social-medias/${data.id}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      profileUrl: data.profileUrl,
      platform: data.platform,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      organization: data.organization,
      primaryAdmin: data.primaryAdmin,
      backupAdmin: data.backupAdmin,
    }),
  })

  const dataResponse = await response.json()
  if (!response.ok) {
    if (dataResponse?.error) {
      throw new EndpointError(dataResponse.error, response.status)
    }
    throw new Error('Failed to update a social media')
  }

  return dataResponse
}

/**
 * Changes the status of a social media account.
 * @param id
 * @param newStatus
 * @param deactivationReason
 * @returns
 */
export const changeStatusSocialMedia = async (
  id: number,
  newStatus: SocialMediaStatusEnum,
  deactivationReason?: string,
) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/social-medias/status/${id}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      status: newStatus,
      deactivationReason,
    }),
  })

  const dataResponse = await response.json()
  if (!response.ok) {
    if (dataResponse?.error) {
      throw new EndpointError(dataResponse.error, response.status)
    }
    throw new Error('Failed to approve a social media')
  }

  return dataResponse
}
