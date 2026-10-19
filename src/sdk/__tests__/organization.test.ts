import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUnit, disableUnit, getUnitById, updateUnit } from '../organization'
import { UnitTypeEnum } from '@/features/units/schemas'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildOrganization } from '@/shared/__tests__/fixtures'
import { BASE_URL, htmlResponse, jsonResponse, setupFetchMock } from './sdk-fetch'

const fakePayload = createFakePayload()
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: fakePayload.asPayload() }),
}))

const { fetchMock, lastCall } = setupFetchMock()

const unit = {
  name: 'Dirección de Comunicaciones',
  type: UnitTypeEnum.OFFICE,
  parent: '90',
  admin: '12',
  backupAdmins: ['14', '15'],
  websiteUrl: 'https://universidad-andina.edu/comunicaciones',
  status: 'active' as const,
  description: 'Gestiona las cuentas institucionales',
  delegatedPermissions: true,
  tenant: 10,
}

beforeEach(() => fakePayload.findByID.mockReset())

describe('createUnit', () => {
  it('should convert ids to numbers when posting', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 100 }))
    await createUnit(unit)
    expect(lastCall().url).toBe(`${BASE_URL}/api/organization`)
    expect(lastCall().body).toMatchObject({
      parentOrg: 90,
      admin: 12,
      backupAdmins: [14, 15],
      tenant: 10,
    })
  })

  it('should send a null admin when the unit is not assigned yet', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 100 }))
    await createUnit({ ...unit, admin: 'not_assigned', parent: undefined, backupAdmins: undefined })
    expect(lastCall().body.admin).toBeNull()
    expect(lastCall().body.parentOrg).toBeUndefined()
  })

  it('should list the validation errors returned on a 400', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        error: 'Invalid',
        details: {
          name: 'ValidationError',
          data: {
            errors: [
              { path: 'name', message: 'Name is already used' },
              { path: 'admin', message: 'Admin is inactive' },
            ],
          },
        },
      }),
    )
    await expect(createUnit(unit)).rejects.toThrow(
      'name: Name is already used\nadmin: Admin is inactive',
    )
  })

  it('should throw a generic error for other failures', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(createUnit(unit)).rejects.toThrow('Failed to create unit')
  })
})

describe('updateUnit', () => {
  it('should patch the unit including its id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 100 }))
    await updateUnit({ ...unit, id: 100 })
    expect(lastCall().init.method).toBe('PATCH')
    expect(lastCall().body).toMatchObject({ id: 100, admin: 12 })
    expect(lastCall().body).not.toHaveProperty('tenant')
  })

  it('should throw when the update fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(updateUnit({ ...unit, id: 100 })).rejects.toThrow('Failed to update unit')
  })
})

describe('disableUnit', () => {
  it('should put to the disable endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await disableUnit(100)
    expect(lastCall().url).toBe(`${BASE_URL}/api/organization/disable/100`)
    expect(lastCall().init.method).toBe('PUT')
  })

  it('should throw when the unit cannot be disabled', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, {}))
    await expect(disableUnit(100)).rejects.toThrow(
      'We could not disable this unit. Please try again.',
    )
  })

  it('should tell the user their session expired on a 401 (GIQ-106)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Unauthorized' }))
    await expect(disableUnit(100)).rejects.toThrow('Your session has expired. Please log in again.')
  })

  it('should surface the reason given by the server (GIQ-106)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { error: 'Cannot disable this unit while it has active sub-units: A.' }),
    )
    await expect(disableUnit(100)).rejects.toThrow(
      'Cannot disable this unit while it has active sub-units: A.',
    )
  })

  it('should fall back to a generic message when the error body is not JSON (GIQ-106)', async () => {
    fetchMock.mockResolvedValue(htmlResponse(502))
    await expect(disableUnit(100)).rejects.toThrow(
      'We could not disable this unit. Please try again.',
    )
  })
})

describe('getUnitById', () => {
  it('should read the organization through Payload', async () => {
    const organization = buildOrganization({ id: 100 })
    fakePayload.findByID.mockResolvedValue(organization)
    await expect(getUnitById(100)).resolves.toBe(organization)
    expect(fakePayload.findByID).toHaveBeenCalledWith({ collection: 'organization', id: 100 })
  })
})
