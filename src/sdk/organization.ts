import { createOrgFormSchema, updateOrgFormSchema } from '@/features/organizations'
import { z } from 'zod'
import { env } from '@/config/env'
import { JSON_HEADERS } from '@/shared/constants'
import { Organization } from '@/types/payload-types'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'

export const createOrganization = async (data: z.infer<typeof createOrgFormSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/organization`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      type: data.type,
      parentOrg: data.parent ? Number(data.parent) : undefined,
      admin: data.admin ? Number(data.admin) : undefined,
      backupAdmins: data.backupAdmins ? data.backupAdmins.map((admin) => Number(admin)) : undefined,
      email: data.email,
      phone: data.phone,
      status: data.status,
      description: data.description,
      delegatedPermissions: data.delegatedPermissions,
    }),
  })

  if (response?.status === 400) {
    const errorData = await response.json()
    if (errorData?.error && errorData.details.name === 'ValidationError') {
      const validationErrors = errorData.details.data.errors.map(
        (error: { message: string; path: string }) => `${error.path}: ${error.message}`,
      )
      throw new Error(`${validationErrors.join('\n')}`)
    }
  }

  if (!response.ok) {
    throw new Error('Failed to create organization')
  }

  return response.json()
}

export const updateOrganization = async (data: z.infer<typeof updateOrgFormSchema>) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/organization`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      id: data.id,
      name: data.name,
      type: data.type,
      parentOrg: data.parent ? Number(data.parent) : undefined,
      admin: data.admin ? Number(data.admin) : undefined,
      backupAdmins: data.backupAdmins ? data.backupAdmins.map((admin) => Number(admin)) : undefined,
      email: data.email,
      phone: data.phone,
      status: data.status,
      description: data.description,
      delegatedPermissions: data.delegatedPermissions,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update organization')
  }

  return response.json()
}

/**
 * Returns an organization by id
 * @returns
 */
export const getOrganizationById = async (id: number): Promise<Organization> => {
  const { payload } = await getPayloadContext()
  const organization = await payload.findByID({
    collection: 'organization',
    id,
  })
  return organization
}

export const disableOrganization = async (id: number) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/organization/disable/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to disable organization')
  }

  return response.json()
}
