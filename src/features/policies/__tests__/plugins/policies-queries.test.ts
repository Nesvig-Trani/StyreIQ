import { getLastPolicyVersion, getPolicies, hasUserAcknowledged } from '../../plugins/queries'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'
import { UserRolesEnum } from '@/features/users'

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

describe('getLastPolicyVersion', () => {
  it('should return null when nobody is signed in', async () => {
    expect(await getLastPolicyVersion()).toBeNull()
    expect(boundary.payload?.find).not.toHaveBeenCalled()
  })

  it('should return null for a SuperAdmin who has not selected a tenant', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    expect(await getLastPolicyVersion()).toBeNull()
    expect(boundary.payload?.find).not.toHaveBeenCalled()
  })

  it('should read the newest policy of the tenant selected by a SuperAdmin, bypassing access rules', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    boundary.cookies.set('styreiq_selected_tenant', '12')
    boundary.payload?.find.mockResolvedValue({ docs: [{ id: 4, version: 1.3 }] })

    const policy = await getLastPolicyVersion()

    expect(policy).toEqual({ id: 4, version: 1.3 })
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'policies',
        where: { tenant: { equals: 12 } },
        sort: '-version',
        limit: 1,
        overrideAccess: true,
      }),
    )
  })

  it('should return null when the user has no tenant', async () => {
    asRole(UserRolesEnum.CentralAdmin, { tenant: null })
    expect(await getLastPolicyVersion()).toBeNull()
  })

  it('should read the newest policy of the user tenant under normal access rules', async () => {
    asRole(UserRolesEnum.CentralAdmin)
    boundary.payload?.find.mockResolvedValue({ docs: [{ id: 7, version: 0.4 }] })

    expect(await getLastPolicyVersion()).toEqual({ id: 7, version: 0.4 })
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenant: { equals: 10 } }, overrideAccess: false }),
    )
  })

  it('should return null when the tenant has no policies yet', async () => {
    asRole(UserRolesEnum.CentralAdmin)
    expect(await getLastPolicyVersion()).toBeNull()
  })
})

describe('getPolicies', () => {
  it('should return an empty list when nobody is signed in', async () => {
    expect(await getPolicies()).toEqual({ docs: [] })
  })

  it('should return an empty page when there is no tenant to scope to', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    const result = await getPolicies()
    expect(result).toMatchObject({ docs: [], totalDocs: 0, totalPages: 0 })
    expect(boundary.payload?.find).not.toHaveBeenCalled()
  })

  it('should list the policies of the tenant selected by a SuperAdmin', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    boundary.cookies.set('styreiq_selected_tenant', '12')
    await getPolicies()
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'policies',
        where: { tenant: { equals: 12 } },
        overrideAccess: true,
      }),
    )
  })

  it('should list the policies of the user tenant for other roles', async () => {
    asRole(UserRolesEnum.UnitAdmin)
    await getPolicies()
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenant: { equals: 10 } }, overrideAccess: false }),
    )
  })
})

describe('hasUserAcknowledged', () => {
  it('should be false when nobody is signed in', async () => {
    expect(await hasUserAcknowledged({ userId: 31, lastVersionId: 4 })).toBe(false)
  })

  it('should be true when an acknowledgment of that policy exists for the user', async () => {
    asRole(UserRolesEnum.SocialMediaManager)
    boundary.payload?.find.mockResolvedValue({ docs: [{ id: 1 }] })

    expect(await hasUserAcknowledged({ userId: 31, lastVersionId: 4 })).toBe(true)
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'acknowledgments',
        where: { user: { equals: 31 }, policy: { equals: 4 } },
        overrideAccess: false,
      }),
    )
  })

  it('should be false when the user has not acknowledged the policy', async () => {
    asRole(UserRolesEnum.SocialMediaManager)
    expect(await hasUserAcknowledged({ userId: 31, lastVersionId: 4 })).toBe(false)
  })
})
