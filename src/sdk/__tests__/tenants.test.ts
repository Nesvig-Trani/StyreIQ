import { describe, expect, it } from 'vitest'
import {
  createTenant,
  selectTenantRequest,
  updateGovernanceSettings,
  updateTenant,
} from '../tenants'
import { EndpointError } from '@/shared'
import { BASE_URL, htmlResponse, jsonResponse, setupFetchMock } from './sdk-fetch'

const { fetchMock, lastCall } = setupFetchMock()

const tenantForm = {
  name: 'Universidad Andina',
  domain: 'universidad-andina.edu',
  adminContactName: 'Valentina Restrepo',
  adminContactEmail: 'valentina.restrepo@universidad-andina.edu',
  timezone: 'America/Chicago' as const,
  notes: 'Piloto 2026',
  enabledTrainings: [
    { trainingId: 'training-governance' as const, assignedRoles: ['unit_admin' as const] },
  ],
}

describe('createTenant', () => {
  it('should create an active tenant with the default governance settings', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 10 }))
    await createTenant(tenantForm)
    const { url, body } = lastCall()
    expect(url).toBe(`${BASE_URL}/api/tenants`)
    expect(body).toMatchObject({
      name: 'Universidad Andina',
      status: 'active',
      metadata: { timezone: 'America/Chicago', notes: 'Piloto 2026' },
      governanceSettings: {
        reminderSchedule: [{ day: 3 }, { day: 7 }, { day: 14 }],
        rollCallFrequency: 'quarterly',
        passwordUpdateCadenceDays: 180,
      },
    })
  })

  it('should throw when creation fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(createTenant(tenantForm)).rejects.toThrow('Failed to create tenant')
  })
})

describe('updateGovernanceSettings', () => {
  const settings = {
    reminderSchedule: [{ day: 5 }],
    escalationDays: [{ day: 20 }],
    rollCallFrequency: 'monthly' as const,
    passwordUpdateCadenceDays: 90,
  }

  it('should patch the tenant governance endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await updateGovernanceSettings(10, settings)
    expect(lastCall().url).toBe(`${BASE_URL}/api/tenants/10/governance`)
    expect(lastCall().body).toEqual(settings)
  })

  it('should throw an EndpointError carrying the status', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Only super admins can do this' }))
    const failure = await updateGovernanceSettings(10, settings).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(EndpointError)
    expect(failure).toMatchObject({ message: 'Only super admins can do this', code: 403 })
  })

  it('should use the fallback message when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(htmlResponse(502))
    await expect(updateGovernanceSettings(10, settings)).rejects.toThrow(
      'Failed to update governance settings',
    )
  })
})

describe('selectTenantRequest', () => {
  it('should post the selected tenant id, or null to clear it', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }))
    await selectTenantRequest(10)
    expect(lastCall().body).toEqual({ tenantId: 10 })
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }))
    await selectTenantRequest(null)
    expect(lastCall().body).toEqual({ tenantId: null })
  })

  it('should prefer error, then message, then the fallback', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: 'Tenant disabled' }))
    await expect(selectTenantRequest(10)).rejects.toThrow('Tenant disabled')
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { message: 'Tenant not found' }))
    await expect(selectTenantRequest(99)).rejects.toMatchObject({ code: 404 })
    fetchMock.mockResolvedValueOnce(htmlResponse(500))
    await expect(selectTenantRequest(10)).rejects.toThrow('Failed to select tenant')
  })
})

describe('updateTenant', () => {
  it('should patch the tenant without touching governance settings', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 10 }))
    await updateTenant(10, tenantForm)
    expect(lastCall().url).toBe(`${BASE_URL}/api/tenants/10`)
    expect(lastCall().body).not.toHaveProperty('governanceSettings')
    expect(lastCall().body.metadata).toEqual({ timezone: 'America/Chicago', notes: 'Piloto 2026' })
  })

  it('should throw an EndpointError on failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { error: 'Domain already in use' }))
    await expect(updateTenant(10, tenantForm)).rejects.toMatchObject({
      message: 'Domain already in use',
      code: 409,
    })
  })
})
