import { createOrgFormSchema } from '@/schemas/organization'
import { z } from 'zod'

export const createOrganization = async (data: z.infer<typeof createOrgFormSchema>) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      type: data.type,
      parentOrg: data.parent ? Number(data.parent) : undefined,
      admin: data.admin ? Number(data.admin) : undefined,
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

  return await response.json()
}
