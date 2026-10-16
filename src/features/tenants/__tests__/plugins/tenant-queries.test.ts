import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTenantById, getTenants } from '@/features/tenants/plugins/queries'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { buildUser } from '@/shared/__tests__/fixtures'
import { createAuthPayload, pageOf } from '@/features/units/__tests__/unit-fixtures'
import { buildTenant } from '../tenant-fixtures'

const payload = createAuthPayload()
const requestHeaders = new Headers({ cookie: 'payload-token=abc123' })
const cookieJar = new Map<string, string>()

vi.mock('next/headers', () => ({
  headers: async () => requestHeaders,
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: payload.asPayload() }),
}))

beforeEach(() => {
  payload.auth.mockReset()
  payload.find.mockReset()
  payload.findByID.mockReset()
  cookieJar.clear()
  payload.find.mockResolvedValue(pageOf([buildTenant()]))
})

describe('getTenants', () => {
  it('should return an empty page for anonymous visitors', async () => {
    payload.auth.mockResolvedValue({ user: null })
    const result = await getTenants({ pageSize: 10, pageIndex: 0 })
    expect(result).toEqual({ docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10 })
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should scope central admins to their own tenant without overriding access', async () => {
    const user = buildUser({ roles: ['central_admin'], tenant: 10 })
    payload.auth.mockResolvedValue({ user })
    await getTenants({ tenantIds: [10, 11], pageSize: 20, pageIndex: 1 })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'tenants',
        limit: 20,
        page: 2,
        where: { id: { equals: 10 } },
        overrideAccess: false,
      }),
    )
  })

  it('should return an empty page for a central admin without tenant', async () => {
    payload.auth.mockResolvedValue({ user: buildUser({ roles: ['central_admin'], tenant: null }) })
    const result = await getTenants({ pageSize: 10, pageIndex: 0 })
    expect(result.docs).toEqual([])
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should let super admins list everything and filter by ids', async () => {
    payload.auth.mockResolvedValue({ user: buildUser({ roles: ['super_admin'], tenant: null }) })
    await getTenants({ tenantIds: [10, 11], pageSize: 10, pageIndex: 0 })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [10, 11] } }, overrideAccess: true }),
    )
  })

  it('should narrow super admins to the tenant selected in the cookie', async () => {
    cookieJar.set(SELECTED_TENANT_COOKIE_NAME, '11')
    payload.auth.mockResolvedValue({ user: buildUser({ roles: ['super_admin'], tenant: null }) })
    await getTenants({ pageSize: 10, pageIndex: 0 })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { equals: 11 } },
        user: expect.objectContaining({ tenant: 11 }),
      }),
    )
  })

  it('should apply the plain filter for lower roles', async () => {
    payload.auth.mockResolvedValue({
      user: buildUser({ roles: ['unit_admin'], tenant: 10, organizations: [100] }),
    })
    await getTenants({ pageSize: 10, pageIndex: 0 })
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, overrideAccess: false }),
    )
  })
})

describe('getTenantById', () => {
  it('should load the tenant by id', async () => {
    const tenant = buildTenant({ id: 12 })
    payload.findByID.mockResolvedValue(tenant)
    expect(await getTenantById({ id: 12 })).toEqual(tenant)
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'tenants', id: 12 })
  })
})
