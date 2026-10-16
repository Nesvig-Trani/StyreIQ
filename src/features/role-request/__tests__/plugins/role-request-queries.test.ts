import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRoleRequests } from '../../plugins/queries'
import { UserRolesEnum } from '@/features/users'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'

const boundary = vi.hoisted(() => ({
  payload: undefined as
    | undefined
    | ReturnType<typeof import('@/shared/__tests__/payload-fakes').createFakePayload>,
  user: null as null | ReturnType<typeof import('@/shared/__tests__/fixtures').buildUser>,
  cookies: new Map<string, string>(),
}))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: boundary.payload }),
}))
vi.mock('@/features/auth/utils/getAuthUser', () => ({
  getAuthUser: async () => ({ user: boundary.user }),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = boundary.cookies.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))

beforeEach(() => {
  boundary.payload = createFakePayload()
  boundary.user = null
  boundary.cookies = new Map()
})

const asRole = (role: UserRolesEnum, overrides = {}) => {
  boundary.user = buildUser({ id: 31, roles: [role], tenant: 10, ...overrides })
}

describe('getRoleRequests', () => {
  it('should throw when nobody is signed in', async () => {
    await expect(getRoleRequests()).rejects.toThrow('Unauthorized')
  })

  it('should not filter by tenant for a SuperAdmin viewing every tenant', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    await getRoleRequests()
    expect(boundary.payload?.find).toHaveBeenCalledWith({
      collection: 'role-requests',
      where: {},
      limit: 10,
      page: 1,
      sort: '-createdAt',
    })
  })

  it('should scope a SuperAdmin to the tenant selected in the cookie', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    boundary.cookies.set('styreiq_selected_tenant', '12')
    await getRoleRequests()
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenant: { equals: 12 } } }),
    )
  })

  it('should scope a Central Admin to their own tenant', async () => {
    asRole(UserRolesEnum.CentralAdmin)
    await getRoleRequests()
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenant: { equals: 10 } } }),
    )
  })

  it('should throw when a Central Admin has no tenant', async () => {
    asRole(UserRolesEnum.CentralAdmin, { tenant: null })
    await expect(getRoleRequests()).rejects.toThrow('User has no tenant assigned')
  })

  it.each([UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager])(
    'should limit a %s to their own requests',
    async (role) => {
      asRole(role)
      await getRoleRequests()
      expect(boundary.payload?.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { and: [{ user: { equals: 31 } }, { tenant: { equals: 10 } }] },
        }),
      )
    },
  )

  it('should throw when a Unit Admin has no tenant', async () => {
    asRole(UserRolesEnum.UnitAdmin, { tenant: null })
    await expect(getRoleRequests()).rejects.toThrow('User has no tenant assigned')
  })

  it('should throw when the user has no role that can view requests', async () => {
    asRole(UserRolesEnum.SocialMediaManager, { roles: [] })
    await expect(getRoleRequests()).rejects.toThrow(
      'User does not have permission to view role requests',
    )
  })

  it('should apply the tenant, status and pagination filters from the search params', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    await getRoleRequests({ tenant: [10, 11], status: 'pending', pageSize: 5, pageIndex: 2 })
    expect(boundary.payload?.find).toHaveBeenCalledWith({
      collection: 'role-requests',
      where: { tenant: { in: [10, 11] }, status: { equals: 'pending' } },
      limit: 5,
      page: 3,
      sort: '-createdAt',
    })
  })
})
