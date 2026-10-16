import { describe, expect, it } from 'vitest'
import { acceptPolicy, savePolicy } from '../policies'
import { approveRoleRequest, createRoleRequest } from '../request-role'
import { UserRolesEnum } from '@/features/users'
import { BASE_URL, jsonResponse, setupFetchMock } from './sdk-fetch'

const { fetchMock, lastCall } = setupFetchMock()

describe('policies', () => {
  it('should save the policy text for the tenant', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 2 }))
    await savePolicy({ data: 'Política de uso de redes sociales', tenant: 10 })
    expect(lastCall().url).toBe(`${BASE_URL}/api/policies`)
    expect(lastCall().body).toEqual({ text: 'Política de uso de redes sociales', tenant: 10 })
  })

  it('should throw when the policy cannot be created', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(savePolicy({ data: 'x' })).rejects.toThrow('Failed to create policy')
  })

  it('should record the acknowledgment of a policy', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 3 }))
    await acceptPolicy({ policy: 2, tenant: 10 })
    expect(lastCall().url).toBe(`${BASE_URL}/api/acknowledgments`)
    expect(lastCall().body).toEqual({ policy: 2, tenant: 10 })
  })

  it('should throw when the acknowledgment cannot be saved', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(acceptPolicy({ policy: 2 })).rejects.toThrow('Failed to save policy')
  })
})

describe('role requests', () => {
  const request = {
    requestedRole: UserRolesEnum.UnitAdmin,
    organization: '100',
    justification: 'Coordino las redes de la Dirección de Comunicaciones.',
  }

  it('should post the role request', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))
    await createRoleRequest(request)
    expect(lastCall().url).toBe(`${BASE_URL}/api/role-requests`)
    expect(lastCall().body).toEqual(request)
  })

  it('should throw the server message when the request is rejected', async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { message: 'A request is already pending' }))
    await expect(createRoleRequest(request)).rejects.toThrow('A request is already pending')
  })

  it('should fall back to a generic message when none is provided', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(createRoleRequest(request)).rejects.toThrow('Failed to create role request')
  })

  it('should post the approval decision with review notes', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await approveRoleRequest(5, true, 'Aprobado por la Dirección')
    expect(lastCall().url).toBe(`${BASE_URL}/api/role-requests/5/approve`)
    expect(lastCall().body).toEqual({ approved: true, reviewNotes: 'Aprobado por la Dirección' })
  })

  it('should throw when processing the request fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { message: 'Not your unit' }))
    await expect(approveRoleRequest(5, false)).rejects.toThrow('Not your unit')
    fetchMock.mockResolvedValueOnce(jsonResponse(500, {}))
    await expect(approveRoleRequest(5, false)).rejects.toThrow('Failed to process role request')
  })
})
