import { createOrgFormSchema, updateOrgFormSchema } from '@/organizations'
import { z } from 'zod'
import { env } from '@/config/env'
import { JSON_HEADERS } from '@/shared/constants'

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

