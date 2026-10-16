import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createUnit,
  disableUnit,
  filteredUsers,
  updateUnit,
} from '@/features/units/plugins/endpoints'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({ id: 3, roles: ['unit_admin'], tenant: 10, organizations: [100] })

const run = async (endpoint: typeof createUnit, req: ReturnType<typeof createFakeRequest>) =>
  await endpoint.handler(req.asRequest())

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('createUnit endpoint', () => {
  const body = {
    name: 'Dirección de Comunicaciones',
    type: 'office',
    parentOrg: 100,
    status: 'active',
  }

  it('should return 400 without a JSON body', async () => {
    const response = await run(createUnit, createFakeRequest({ user: centralAdmin }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing JSON body' })
  })

  it('should return 401 for anonymous requests', async () => {
    const response = await run(createUnit, createFakeRequest({ body }))
    expect(response.status).toBe(401)
  })

  it('should return 403 when creating a unit in another tenant (GIQ-85)', async () => {
    const payload = createFakePayload()
    const response = await run(
      createUnit,
      createFakeRequest({ user: centralAdmin, payload, body: { ...body, tenant: 11 } }),
    )
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Cannot access unit from different tenant' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 400 when a non super admin has no tenant', async () => {
    const user = buildUser({ roles: ['central_admin'], tenant: null })
    const response = await run(createUnit, createFakeRequest({ user, body }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'User has no tenant assigned' })
  })

  it('should require a parent organization for non super admins', async () => {
    const response = await run(
      createUnit,
      createFakeRequest({
        user: centralAdmin,
        body: { name: 'Biblioteca Central', type: 'office' },
      }),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'parentOrg is required for non-super_admin users',
    })
  })

  it('should reject a parent organization from another tenant', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 100, tenant: 99 }))
    const response = await run(createUnit, createFakeRequest({ user: unitAdmin, payload, body }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Parent organization belongs to different tenant',
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 404 when the parent organization does not exist', async () => {
    const response = await run(createUnit, createFakeRequest({ user: unitAdmin, body }))
    expect(response.status).toBe(404)
  })

  it('should create the unit with the caller tenant, compute path and depth and assign the admin', async () => {
    const payload = createFakePayload()
    const parent = buildOrganization({ id: 100, tenant: 10, path: '100', depth: 0 })
    payload.findByID.mockImplementation(async ({ collection }: { collection: string }) =>
      collection === 'users' ? { id: 55, organizations: [100] } : parent,
    )
    payload.create.mockResolvedValue(buildOrganization({ id: 200, name: body.name }))
    const req = createFakeRequest({ user: centralAdmin, payload, body: { ...body, admin: 55 } })

    const response = await run(createUnit, req)

    expect(response.status).toBe(201)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'organization',
        data: expect.objectContaining({ name: body.name, tenant: 10 }),
      }),
    )
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'organization',
      id: 200,
      data: { path: '100/200', depth: 1 },
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 55,
      data: { organizations: [100, 200] },
    })
  })

  it('should let a super admin create a root unit', async () => {
    const payload = createFakePayload()
    payload.create.mockResolvedValue(buildOrganization({ id: 300 }))
    const response = await run(
      createUnit,
      createFakeRequest({
        user: superAdmin,
        payload,
        body: { name: 'Universidad del Valle', type: 'higher_education_institution', tenant: 12 },
      }),
    )
    expect(response.status).toBe(201)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 300, data: expect.objectContaining({ path: '300' }) }),
    )
  })

  it('should return 400 when persisting the unit fails', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 100, tenant: 10 }))
    payload.create.mockRejectedValue(new Error('duplicate name'))
    const response = await run(createUnit, createFakeRequest({ user: unitAdmin, payload, body }))
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('Error creating organizations')
  })
})

describe('updateUnit endpoint', () => {
  const target = buildOrganization({ id: 200, tenant: 10, parentOrg: 100 })
  const body = { id: 200, name: 'Facultad de Artes', parentOrg: 100, admin: 55 }

  const payloadWith = (unit: ReturnType<typeof buildOrganization> | null) => {
    const payload = createFakePayload()
    payload.findByID.mockImplementation(async ({ collection, id }) => {
      if (collection === 'users') return { id, organizations: [150] }
      if (id === 100) return buildOrganization({ id: 100, tenant: 10, path: '100', depth: 0 })
      return unit
    })
    return payload
  }

  it('should return 400 without a body and 401 without a user', async () => {
    expect((await run(updateUnit, createFakeRequest({ user: unitAdmin }))).status).toBe(400)
    expect((await run(updateUnit, createFakeRequest({ body }))).status).toBe(401)
  })

  it('should return 404 when the unit does not exist', async () => {
    const response = await run(
      updateUnit,
      createFakeRequest({ user: unitAdmin, payload: payloadWith(null), body }),
    )
    expect(response.status).toBe(404)
  })

  it('should return 403 when the unit belongs to another tenant (GIQ-85)', async () => {
    const payload = payloadWith(buildOrganization({ id: 200, tenant: 99, parentOrg: 100 }))
    const response = await run(updateUnit, createFakeRequest({ user: unitAdmin, payload, body }))
    expect(response.status).toBe(403)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should forbid non super admins from changing the unit tenant', async () => {
    const response = await run(
      updateUnit,
      createFakeRequest({
        user: centralAdmin,
        payload: payloadWith(target),
        body: { ...body, tenant: 11 },
      }),
    )
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Cannot change unit tenant' })
  })

  it('should reject a parent from another tenant', async () => {
    const payload = createFakePayload()
    payload.findByID.mockImplementation(async ({ id }) =>
      id === 100 ? buildOrganization({ id: 100, tenant: 99 }) : target,
    )
    const response = await run(updateUnit, createFakeRequest({ user: unitAdmin, payload, body }))
    expect(response.status).toBe(400)
  })

  it('should stop non super admins from detaching a unit from its parent', async () => {
    const response = await run(
      updateUnit,
      createFakeRequest({
        user: unitAdmin,
        payload: payloadWith(target),
        body: { id: 200, name: 'Facultad de Artes' },
      }),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'parentOrg is required for non-super_admin users',
    })
  })

  it('should update path, depth and merge the admin organizations without duplicates', async () => {
    const payload = payloadWith(target)
    const response = await run(updateUnit, createFakeRequest({ user: unitAdmin, payload, body }))
    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'organization',
        where: { id: { equals: 200 } },
        data: expect.objectContaining({ path: '100/200', depth: 1, name: 'Facultad de Artes' }),
      }),
    )
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 55,
      data: { organizations: [150, 200] },
    })
  })

  it('should allow a super admin to update a root unit without a parent', async () => {
    const root = buildOrganization({ id: 200, tenant: 10, parentOrg: null })
    const payload = payloadWith(root)
    const response = await run(
      updateUnit,
      createFakeRequest({
        user: superAdmin,
        payload,
        body: { id: 200, name: 'Universidad Andina' },
      }),
    )
    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledTimes(1)
  })

  it('should return 400 when the update fails', async () => {
    const payload = payloadWith(target)
    payload.update.mockRejectedValue(new Error('constraint'))
    const response = await run(updateUnit, createFakeRequest({ user: unitAdmin, payload, body }))
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('Error updating organization')
  })
})

describe('disableUnit endpoint', () => {
  const disable = (user: typeof superAdmin | null, payload = createFakePayload(), id?: string) =>
    run(disableUnit, createFakeRequest({ user, payload, routeParams: id ? { id } : {} }))

  it('should return 404 without an id', async () => {
    const response = await disable(superAdmin)
    expect(response.status).toBe(404)
  })

  it('should return 401 for anonymous requests', async () => {
    expect((await disable(null, undefined, '200')).status).toBe(401)
  })

  it('should return 403 for roles that cannot disable units', async () => {
    const socialMediaManager = buildUser({ id: 4, roles: ['social_media_manager'], tenant: 10 })
    const payload = createFakePayload()
    for (const user of [unitAdmin, socialMediaManager]) {
      const response = await disable(user, payload, '200')
      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        error: 'You do not have permission to disable units.',
      })
    }
    expect(payload.findByID).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should return 404 for a non numeric id', async () => {
    const payload = createFakePayload()
    const response = await disable(superAdmin, payload, 'abc')
    expect(response.status).toBe(404)
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('should return 404 when the unit does not exist', async () => {
    const response = await disable(superAdmin, createFakePayload(), '200')
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Organization not found' })
  })

  it('should flag the unit as disabled', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 200, tenant: 10 }))
    payload.update.mockResolvedValue({ docs: [{ id: 200, disabled: true }] })
    const response = await disable(superAdmin, payload, '200')
    expect(response.status).toBe(200)
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'organization', id: 200 })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'organization',
      where: { id: { equals: 200 } },
      data: { disabled: true },
    })
  })

  it('should let a central admin disable a unit of their own tenant (GIQ-106)', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 200, tenant: 10 }))
    payload.update.mockResolvedValue({ docs: [{ id: 200, disabled: true }] })
    const response = await disable(centralAdmin, payload, '200')
    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'organization',
      where: { id: { equals: 200 } },
      data: { disabled: true },
    })
  })

  it('should return 403 when a central admin targets a unit of another tenant (GIQ-106)', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 200, tenant: 11 }))
    const response = await disable(centralAdmin, payload, '200')
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Cannot access unit from different tenant' })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should refuse to disable a unit that still has active sub-units (GIQ-106)', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 200, tenant: 10 }))
    payload.find.mockResolvedValue({
      docs: [{ name: 'Oficina de Prensa' }, { name: 'Archivo Histórico' }],
    })
    const response = await disable(centralAdmin, payload, '200')
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error:
        'Cannot disable this unit while it has active sub-units: Oficina de Prensa, Archivo Histórico. Disable them first.',
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should only look at sub-units that are not already disabled (GIQ-106)', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 200, tenant: 10 }))
    payload.update.mockResolvedValue({ docs: [{ id: 200, disabled: true }] })
    await disable(superAdmin, payload, '200')
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'organization',
        where: {
          and: [
            { parentOrg: { equals: 200 } },
            { or: [{ disabled: { equals: false } }, { disabled: { equals: null } }] },
          ],
        },
      }),
    )
  })

  it('should return 500 for unexpected failures', async () => {
    const payload = createFakePayload()
    payload.findByID.mockRejectedValue(new Error('db down'))
    const response = await disable(superAdmin, payload, '200')
    expect(response.status).toBe(500)
    expect((await response.json()).error).toBe('Internal Server Error')
  })
})

describe('filteredUsers endpoint', () => {
  it('should return an empty list when no parent organization is given', async () => {
    const response = await run(filteredUsers, createFakeRequest({ user: superAdmin }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ docs: [] })
  })
})
