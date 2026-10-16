// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { RoleRequests } from '../../plugins/collections'
import {
  createFakeCollection,
  createFakePayload,
  createFakeRequest,
} from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'

const requester = buildUser({
  id: 31,
  name: 'Camila Ortega',
  email: 'camila.ortega@universidad-andina.edu',
  roles: ['social_media_manager'],
  tenant: 10,
})

const runBeforeChange = async ({
  data,
  operation,
  user = requester,
  stored = requester,
}: {
  data: { user?: number; requestedRole?: string; justification?: string }
  operation: 'create' | 'update'
  user?: ReturnType<typeof buildUser> | null
  stored?: ReturnType<typeof buildUser>
}) => {
  const hook = RoleRequests.hooks?.beforeChange?.[0]
  if (!hook) throw new Error('beforeChange hook missing')
  const payload = createFakePayload()
  payload.findByID.mockResolvedValue(stored)
  const { asRequest } = createFakeRequest({ user, payload })

  const outcome = await hook({
    collection: createFakeCollection('role-requests'),
    context: {},
    data,
    originalDoc: undefined,
    operation,
    req: asRequest(),
  })
  return { payload, data, outcome }
}

describe('RoleRequests beforeChange hook', () => {
  it('should assign the authenticated user as requester when creating without one', async () => {
    const { data } = await runBeforeChange({
      data: { justification: 'Necesito administrar la Dirección de Comunicaciones.' },
      operation: 'create',
    })

    expect(data.user).toBe(31)
  })

  it('should keep the requester sent in the data when creating', async () => {
    const { data } = await runBeforeChange({
      data: { user: 55, justification: 'Cobertura durante el semestre.' },
      operation: 'create',
    })

    expect(data.user).toBe(55)
  })

  it('should leave the requester empty when an anonymous request creates without one', async () => {
    const { data, payload } = await runBeforeChange({
      data: { requestedRole: 'unit_admin' },
      operation: 'create',
      user: null,
    })

    expect(data.user).toBeUndefined()
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('should accept a request for a role the requester does not have', async () => {
    const { data, payload } = await runBeforeChange({
      data: { requestedRole: 'unit_admin' },
      operation: 'create',
    })

    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'users', id: 31 })
    expect(data.user).toBe(31)
  })

  it('should reject a request for a role the requester already holds', async () => {
    await expect(
      runBeforeChange({
        data: { requestedRole: 'social_media_manager' },
        operation: 'create',
      }),
    ).rejects.toThrow('You already have the social_media_manager role')
  })

  it('should reject a duplicate role even when the requester holds several roles', async () => {
    const multiRole = buildUser({ id: 31, roles: ['social_media_manager', 'unit_admin'] })

    await expect(
      runBeforeChange({
        data: { requestedRole: 'unit_admin' },
        operation: 'create',
        stored: multiRole,
      }),
    ).rejects.toThrow('You already have the unit_admin role')
  })

  it('should not look up the user when no role is requested', async () => {
    const { payload } = await runBeforeChange({ data: {}, operation: 'create' })

    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('should skip every check when updating a request', async () => {
    const { data, payload } = await runBeforeChange({
      data: { requestedRole: 'social_media_manager' },
      operation: 'update',
    })

    expect(payload.findByID).not.toHaveBeenCalled()
    expect(data.user).toBeUndefined()
  })
})
