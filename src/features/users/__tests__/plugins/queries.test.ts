import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import type { User } from '@/types/payload-types'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { createFakePayload, type FakePayload } from '@/shared/__tests__/payload-fakes'

const getPayloadContext = vi.hoisted(() => vi.fn<() => Promise<{ payload: Payload }>>())
const getAuthUser = vi.hoisted(() => vi.fn<() => Promise<{ user: User | null }>>())
const cookieValues = vi.hoisted(() => new Map<string, string>())

vi.mock('@/shared/utils/getPayloadContext', () => ({ getPayloadContext }))
vi.mock('@/features/auth/utils/getAuthUser', () => ({ getAuthUser }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))

import { UserRolesEnum, UserStatusEnum } from '@/features/users/schemas'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import {
  getAllUsers,
  getPendingActivationUsers,
  getTotalUsers,
  getUserById,
  getUsers,
  getUsersByIds,
  getUsersByOrganizationAndRole,
  getUsersByOrganizations,
  getUsersByRoles,
  getUsersInfoForDashboard,
} from '../../plugins/queries'

const comunicaciones = buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })
const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({
  id: 3,
  roles: ['unit_admin'],
  organizations: [comunicaciones],
  tenant: 10,
})
const socialManager = buildUser({ id: 4, roles: ['social_media_manager'], tenant: 10 })

let payload: FakePayload

const signIn = (user: User | null) => getAuthUser.mockResolvedValue({ user })

beforeEach(() => {
  cookieValues.clear()
  payload = createFakePayload()
  getPayloadContext.mockResolvedValue({ payload: payload.asPayload() })
  signIn(null)
})

describe('getUsersByOrganizations', () => {
  it('should return an empty page when nobody is signed in', async () => {
    const result = await getUsersByOrganizations({ orgIds: [100] })
    expect(result.docs).toEqual([])
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should filter by organization ids with access control enforced', async () => {
    signIn(centralAdmin)
    await getUsersByOrganizations({ orgIds: [100, 101] })
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'users',
      where: { 'organizations.id': { in: [100, 101] } },
      overrideAccess: false,
      user: expect.objectContaining({ id: 2, tenant: 10 }),
    })
  })

  it('should not filter when no organization ids are given', async () => {
    signIn(centralAdmin)
    await getUsersByOrganizations({ orgIds: [] })
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})

describe('getUserById and getUsersByIds', () => {
  it('should load a single user without populating relations', async () => {
    payload.findByID.mockResolvedValue(socialManager)
    expect(await getUserById({ id: 4 })).toBe(socialManager)
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'users', id: 4, depth: 0 })
  })

  it('should skip the query when no ids are given', async () => {
    expect(await getUsersByIds({ ids: [] })).toEqual([])
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should return the matching user documents', async () => {
    payload.find.mockResolvedValue({ docs: [socialManager, unitAdmin] })
    const users = await getUsersByIds({ ids: [3, 4] })
    expect(users).toHaveLength(2)
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [3, 4] } }, limit: 2 }),
    )
  })
})

describe('getPendingActivationUsers', () => {
  it('should return an empty page without a user', async () => {
    const result = await getPendingActivationUsers({ limit: 10, page: 1, user: null })
    expect(result.docs).toEqual([])
  })

  it('should query users waiting for activation', async () => {
    await getPendingActivationUsers({ limit: 10, page: 2, user: unitAdmin })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { equals: 'pending_activation' } },
        limit: 10,
        page: 2,
        overrideAccess: false,
      }),
    )
  })
})

describe('getAllUsers', () => {
  it('should return an empty page when nobody is signed in', async () => {
    expect((await getAllUsers()).docs).toEqual([])
  })

  it('should scope super admins to the selected tenant cookie and bypass access rules', async () => {
    signIn(superAdmin)
    cookieValues.set(SELECTED_TENANT_COOKIE_NAME, '10')
    await getAllUsers()
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenant: { equals: 10 } },
        overrideAccess: true,
        user: expect.objectContaining({ tenant: 10 }),
      }),
    )
  })

  it('should not add a tenant filter for other roles', async () => {
    signIn(centralAdmin)
    await getAllUsers()
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, overrideAccess: false }),
    )
  })
})

describe('getTotalUsers', () => {
  it('should return the total number of users', async () => {
    payload.find.mockResolvedValue({ docs: [], totalDocs: 42 })
    expect(await getTotalUsers()).toBe(42)
  })

  it('should return 0 when the lookup fails', async () => {
    payload.find.mockRejectedValue(new Error('database offline'))
    expect(await getTotalUsers()).toBe(0)
  })
})

describe('getUsersByRoles', () => {
  it('should return an empty page when nobody is signed in', async () => {
    expect((await getUsersByRoles([UserRolesEnum.UnitAdmin])).docs).toEqual([])
  })

  it('should scope non super admins to their own tenant and default to active users', async () => {
    signIn(centralAdmin)
    await getUsersByRoles([UserRolesEnum.UnitAdmin])
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          roles: { in: ['unit_admin'] },
          status: { in: ['active'] },
          tenant: { equals: 10 },
        },
        overrideAccess: false,
      }),
    )
  })

  it('should follow the selected tenant cookie for super admins', async () => {
    signIn(superAdmin)
    cookieValues.set(SELECTED_TENANT_COOKIE_NAME, '12')
    await getUsersByRoles([UserRolesEnum.CentralAdmin], [UserStatusEnum.Inactive])
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          roles: { in: ['central_admin'] },
          status: { in: ['inactive'] },
          tenant: { equals: 12 },
        },
        overrideAccess: true,
      }),
    )
  })
})

describe('getUsersByOrganizationAndRole', () => {
  it('should return an empty page when nobody is signed in', async () => {
    const result = await getUsersByOrganizationAndRole({ organizationId: 100, roles: [] })
    expect(result.totalDocs).toBe(0)
  })

  it('should query active users of an organization with the given roles', async () => {
    signIn(unitAdmin)
    await getUsersByOrganizationAndRole({
      organizationId: 100,
      roles: [UserRolesEnum.SocialMediaManager],
    })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          'organizations.id': { equals: 100 },
          roles: { in: ['social_media_manager'] },
          status: { in: ['active'] },
        },
        limit: 0,
      }),
    )
  })
})

describe('getUsersInfoForDashboard', () => {
  const people: User[] = [
    buildUser({ id: 10, roles: ['unit_admin'], status: 'active', organizations: [comunicaciones] }),
    buildUser({ id: 11, roles: ['social_media_manager'], status: 'active', organizations: [] }),
    buildUser({ id: 12, roles: ['social_media_manager'], status: 'pending_activation' }),
    buildUser({
      id: 13,
      roles: ['unit_admin'],
      status: 'inactive',
      organizations: [comunicaciones],
    }),
    buildUser({ id: 14, roles: ['super_admin'], status: 'active', organizations: [] }),
  ]

  it('should return zeroed data when nobody is signed in', async () => {
    const data = await getUsersInfoForDashboard()
    expect(data.totalAccounts).toBe(0)
  })

  it('should summarise statuses, roles and unassigned accounts for a super admin', async () => {
    signIn(superAdmin)
    payload.find.mockResolvedValue({ docs: people, totalDocs: people.length })
    const data = await getUsersInfoForDashboard()
    expect(data).toEqual({
      totalAccounts: 5,
      accountsByStatus: { active: 3, inactive: 1, inTransition: 1 },
      activeUsers: { superAdmin: 1, unitAdmins: 1, socialMediaManagers: 1 },
      pendingApproval: 1,
      unassignedAccounts: 3,
    })
  })

  it('should only look at the own record for a social media manager', async () => {
    signIn(socialManager)
    await getUsersInfoForDashboard()
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { equals: 4 } }, overrideAccess: false }),
    )
  })

  it('should return zeroed data when an admin has no accessible units', async () => {
    signIn({ ...unitAdmin, organizations: [] })
    const data = await getUsersInfoForDashboard()
    expect(data.totalAccounts).toBe(0)
  })

  it('should filter by accessible organizations for unit admins', async () => {
    signIn(unitAdmin)
    await getUsersInfoForDashboard()
    expect(payload.find).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { 'organizations.id': { in: [100] } } }),
    )
  })
})

describe('getUsers', () => {
  it('should return an empty page keeping the requested pagination when unauthenticated', async () => {
    const result = await getUsers({ pageSize: 20, pageIndex: 3 })
    expect(result).toMatchObject({ docs: [], page: 3, limit: 20 })
  })

  it('should return only the own record for a social media manager', async () => {
    signIn(socialManager)
    await getUsers({ pageSize: 10, pageIndex: 1 })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { equals: 4 } }, limit: 1 }),
    )
  })

  it('should let a super admin narrow by the tenant query parameter', async () => {
    signIn(superAdmin)
    cookieValues.set(SELECTED_TENANT_COOKIE_NAME, '10')
    await getUsers({ pageSize: 10, pageIndex: 2, tenant: '15' })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenant: { equals: 15 } },
        page: 2,
        overrideAccess: true,
      }),
    )
  })

  it('should return an empty page for admins without accessible units', async () => {
    signIn({ ...unitAdmin, organizations: [] })
    const result = await getUsers({ pageSize: 10, pageIndex: 1 })
    expect(result?.docs).toEqual([])
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should list users from the accessible units for a unit admin', async () => {
    signIn(unitAdmin)
    await getUsers({ pageSize: 5, pageIndex: 1 })
    expect(payload.find).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { 'organizations.id': { in: [100] } },
        limit: 5,
        overrideAccess: false,
      }),
    )
  })
})
