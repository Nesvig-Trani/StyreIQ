import { env } from '@/config/env'
import { CreateTenantFormSchema, TenantGovernanceSettingsSchema } from '@/features/tenants/schemas'
import { EndpointError } from '@/shared'
import { JSON_HEADERS } from '@/shared/constants'

export const createTenant = async (data: CreateTenantFormSchema) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/tenants`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      domain: data.domain,
      adminContactName: data.adminContactName,
      adminContactEmail: data.adminContactEmail,
      status: 'active',
      metadata: {
        timezone: data.timezone,
        notes: data.notes,
      },
      governanceSettings: {
        policyReminderDays: [{ day: 3 }, { day: 7 }, { day: 14 }],
        trainingEscalationDays: [{ day: 15 }, { day: 30 }, { day: 45 }],
        rollCallFrequency: 'quarterly',
        passwordRotationDays: 90,
      },
      enabledTrainings: data.enabledTrainings,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create tenant')
  }

  return response.json()
}

export const updateGovernanceSettings = async (
  tenantId: number,
  data: TenantGovernanceSettingsSchema,
) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/tenants/${tenantId}/governance`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new EndpointError(
      errorData.error || 'Failed to update governance settings',
      response.status,
    )
  }

  return response.json()
}

export const selectTenantRequest = async (tenantId: number | null) => {
  const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/tenants/select-tenant`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ tenantId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new EndpointError(
      errorData.error || errorData.message || 'Failed to select tenant',
      response.status,
    )
  }

  return response.json()
}
