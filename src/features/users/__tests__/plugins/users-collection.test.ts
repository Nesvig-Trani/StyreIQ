import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import {
  createFakePayload,
  createFakeRequest,
  type FakePayload,
} from '@/shared/__tests__/payload-fakes'

const getPayloadContext = vi.hoisted(() => vi.fn<() => Promise<{ payload: Payload }>>())
vi.mock('@/shared/utils/getPayloadContext', () => ({ getPayloadContext }))

import { Users } from '../../plugins/collections'

const comunicaciones = buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })
const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({
  id: 3,
  roles: ['unit_admin'],
  organizations: [comunicaciones],
  tenant: 10,
})
const socialManager = buildUser({
  id: 4,
  roles: ['social_media_manager'],
  organizations: [comunicaciones],
  tenant: 10,
})

const access = Users.access
if (!access?.read || !access.create || !access.update || !access.delete) {
  throw new Error('Users collection must define read/create/update/delete access')
}
const { read, create, update, delete: remove } = access

const reqFor = (user: ReturnType<typeof buildUser> | null, payload?: FakePayload) =>
  createFakeRequest({ user, payload }).asRequest()

let payload: FakePayload
beforeEach(() => {
  payload = createFakePayload()
  getPayloadContext.mockResolvedValue({ payload: payload.asPayload() })
})

describe('Users collection definition', () => {
  it('should be the auth-enabled users collection titled by email', () => {
    expect(Users.slug).toBe('users')
    expect(Users.auth).toBe(true)
    expect(Users.admin?.useAsTitle).toBe('email')
  })

  it('should expose the role, status and tenant fields', () => {
    const names = Users.fields.flatMap((field) => ('name' in field ? [field.name] : []))
    expect(names).toEqual(
      expect.arrayContaining(['name', 'roles', 'active_role', 'status', 'organizations', 'tenant']),
    )
  })

  it('should default new users to the social media manager role', () => {
    const roles = Users.fields.find((field) => 'name' in field && field.name === 'roles')
    expect(roles && 'defaultValue' in roles ? roles.defaultValue : null).toEqual([
      'social_media_manager',
    ])
  })

  it('should register all user endpoints', () => {
    expect(Users.endpoints).toHaveLength(9)
  })
})

describe('Users read access', () => {
  it('should deny anonymous requests', async () => {
    expect(await read({ req: reqFor(null) })).toBe(false)
  })

  it('should allow super admins to read every user', async () => {
    expect(await read({ req: reqFor(superAdmin) })).toBe(true)
  })

  it('should deny users without a tenant', async () => {
    expect(await read({ req: reqFor({ ...centralAdmin, tenant: null }) })).toBe(false)
  })

  it('should scope central admins to their tenant', async () => {
    expect(await read({ req: reqFor(centralAdmin) })).toEqual({ tenant: { equals: 10 } })
  })

  it('should scope unit admins to their tenant and accessible units', async () => {
    const result = await read({ req: reqFor(unitAdmin, payload) })
    expect(result).toEqual({
      and: [{ tenant: { equals: 10 } }, { organizations: { in: [100] } }],
    })
  })

  it('should limit social media managers to their own record', async () => {
    expect(await read({ req: reqFor(socialManager) })).toEqual({ id: { equals: 4 } })
  })
})

describe('Users create access', () => {
  it('should deny anonymous requests', async () => {
    expect(await create({ req: reqFor(null) })).toBe(false)
  })

  it('should allow super admins', async () => {
    expect(await create({ req: reqFor(superAdmin) })).toBe(true)
  })

  it('should deny social media managers', async () => {
    expect(await create({ req: reqFor(socialManager) })).toBe(false)
  })

  it('should allow central admins to create users in their tenant', async () => {
    expect(await create({ req: reqFor(centralAdmin), data: { tenant: 10 } })).toBe(true)
  })

  it('should deny central admins creating users in another tenant', async () => {
    expect(await create({ req: reqFor(centralAdmin), data: { tenant: 99 } })).toBe(false)
  })

  it('should require organizations when a unit admin creates a user', async () => {
    expect(await create({ req: reqFor(unitAdmin), data: {} })).toBe(false)
  })

  it('should allow unit admins to assign only units they can access', async () => {
    expect(await create({ req: reqFor(unitAdmin), data: { organizations: [100] } })).toBe(true)
    expect(await create({ req: reqFor(unitAdmin), data: { organizations: [100, 555] } })).toBe(
      false,
    )
  })
})

describe('Users update access', () => {
  const target = buildUser({ id: 4, tenant: 10, organizations: [comunicaciones] })

  it('should deny when no id is provided', async () => {
    expect(await update({ req: reqFor(centralAdmin) })).toBe(false)
  })

  it('should allow super admins', async () => {
    expect(await update({ req: reqFor(superAdmin), id: '4' })).toBe(true)
  })

  it('should deny when the target user cannot be loaded', async () => {
    payload.findByID.mockRejectedValue(new Error('not found'))
    expect(await update({ req: reqFor(centralAdmin, payload), id: '4' })).toBe(false)
  })

  it('should deny central admins editing users from another tenant', async () => {
    payload.findByID.mockResolvedValue({ ...target, tenant: 99 })
    expect(await update({ req: reqFor(centralAdmin, payload), id: '4' })).toBe(false)
  })

  it('should allow central admins editing users in their tenant', async () => {
    payload.findByID.mockResolvedValue(target)
    expect(await update({ req: reqFor(centralAdmin, payload), id: '4' })).toBe(true)
  })

  it('should allow unit admins editing users that share one of their units', async () => {
    payload.findByID.mockResolvedValue(target)
    expect(await update({ req: reqFor(unitAdmin, payload), id: '4' })).toBe(true)
  })

  it('should deny unit admins editing users from unrelated units', async () => {
    const artes = buildOrganization({ id: 555, name: 'Facultad de Artes' })
    payload.findByID.mockResolvedValue({ ...target, organizations: [artes] })
    expect(await update({ req: reqFor(unitAdmin, payload), id: '4' })).toBe(false)
  })

  it('should let social media managers edit only themselves', async () => {
    payload.findByID.mockResolvedValue(target)
    expect(await update({ req: reqFor(socialManager, payload), id: '4' })).toBe(true)
    payload.findByID.mockResolvedValue({ ...target, id: 9 })
    expect(await update({ req: reqFor(socialManager, payload), id: '9' })).toBe(false)
  })
})

describe('Users delete access', () => {
  it('should deny when no id is provided', async () => {
    expect(await remove({ req: reqFor(superAdmin) })).toBe(false)
  })

  it('should allow super admins', async () => {
    expect(await remove({ req: reqFor(superAdmin), id: '4' })).toBe(true)
  })

  it('should allow central admins to delete users from their tenant only', async () => {
    payload.findByID.mockResolvedValue(buildUser({ id: 4, tenant: 10 }))
    expect(await remove({ req: reqFor(centralAdmin, payload), id: '4' })).toBe(true)
    payload.findByID.mockResolvedValue(buildUser({ id: 4, tenant: 99 }))
    expect(await remove({ req: reqFor(centralAdmin, payload), id: '4' })).toBe(false)
  })

  it('should deny unit admins and social media managers', async () => {
    expect(await remove({ req: reqFor(unitAdmin, payload), id: '4' })).toBe(false)
    expect(await remove({ req: reqFor(socialManager, payload), id: '4' })).toBe(false)
  })
})
