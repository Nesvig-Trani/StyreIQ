import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllUnits, getUnitsWithFilter } from '@/features/units/plugins/queries'
import { getUnitAccessByUserId } from '@/features/units/plugins/queries/unit-access.queries'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { createAuthPayload, pageOf } from '../unit-fixtures'

const payload = createAuthPayload()
const cookieJar = new Map<string, string>()
const drizzleOrganizations = vi.fn()

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({
    payload: Object.assign(payload.asPayload(), {
      db: { drizzle: { query: { organization: { findMany: drizzleOrganizations } } } },
    }),
  }),
}))

const superAdmin = buildUser({ roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ roles: ['central_admin'], tenant: 10, organizations: [100] })
const disabledFilter = { or: [{ disabled: { equals: false } }, { disabled: { equals: null } }] }

beforeEach(() => {
  payload.auth.mockReset()
  payload.find.mockReset()
  drizzleOrganizations.mockReset()
  cookieJar.clear()
  payload.find.mockResolvedValue(pageOf([buildOrganization()]))
})

describe('getAllUnits', () => {
  it('should return an empty result for anonymous visitors', async () => {
    payload.auth.mockResolvedValue({ user: null })
    const result = await getAllUnits()
    expect(result.docs).toEqual([])
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should not override access for regular roles and tenant scope the user', async () => {
    payload.auth.mockResolvedValue({ user: centralAdmin })
    await getAllUnits()
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'organization',
        where: disabledFilter,
        overrideAccess: false,
        user: expect.objectContaining({ tenant: 10 }),
      }),
    )
  })

  it('should filter super admins by the selected tenant cookie', async () => {
    cookieJar.set(SELECTED_TENANT_COOKIE_NAME, '12')
    payload.auth.mockResolvedValue({ user: superAdmin })
    await getAllUnits()
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...disabledFilter, tenant: { equals: 12 } },
        overrideAccess: true,
      }),
    )
  })

  it('should return an empty result when the lookup fails', async () => {
    payload.auth.mockResolvedValue({ user: centralAdmin })
    payload.find.mockRejectedValue(new Error('db down'))
    const result = await getAllUnits()
    expect(result.totalDocs).toBe(0)
  })
})

describe('getUnitsWithFilter', () => {
  it('should return an empty result for anonymous visitors', async () => {
    payload.auth.mockResolvedValue({ user: null })
    const result = await getUnitsWithFilter({})
    expect(result.docs).toEqual([])
  })

  it('should apply status, type and tenant filters for super admins', async () => {
    cookieJar.set(SELECTED_TENANT_COOKIE_NAME, '12')
    payload.auth.mockResolvedValue({ user: superAdmin })
    await getUnitsWithFilter({ status: 'active', type: 'office', tenant: ['10', '11'] })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: true,
        where: {
          ...disabledFilter,
          status: { equals: 'active' },
          type: { equals: 'office' },
          tenant: { in: [10, 11] },
        },
      }),
    )
  })

  it('should use the selected tenant when no tenant filter is given', async () => {
    cookieJar.set(SELECTED_TENANT_COOKIE_NAME, '12')
    payload.auth.mockResolvedValue({ user: superAdmin })
    await getUnitsWithFilter({})
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ...disabledFilter, tenant: { equals: 12 } } }),
    )
  })

  it('should limit other roles to their organizations and the direct children', async () => {
    payload.auth.mockResolvedValue({
      user: buildUser({
        roles: ['unit_admin'],
        tenant: 10,
        organizations: [buildOrganization({ id: 100 })],
      }),
    })
    drizzleOrganizations
      .mockResolvedValueOnce([{ id: 100 }])
      .mockResolvedValueOnce([{ id: 100 }, { id: 101 }])
    await getUnitsWithFilter({ status: 'active', type: 'office' })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: false,
        where: {
          and: [
            { id: { in: [100, 101] } },
            disabledFilter,
            { status: { equals: 'active' } },
            { type: { equals: 'office' } },
          ],
        },
      }),
    )
  })
})

describe('getUnitAccessByUserId', () => {
  it('should look up the enabled organization access of the user', async () => {
    await getUnitAccessByUserId({ id: 7 })
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'organization_access',
      where: {
        and: [{ 'user.id': { equals: 7 } }, { 'organization.disabled': { not_equals: true } }],
      },
    })
  })
})
