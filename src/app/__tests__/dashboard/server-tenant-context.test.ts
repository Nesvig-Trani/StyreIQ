import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createUserForQueriesFromCookie,
  getSelectedTenantIdFromCookie,
  getServerTenantContext,
  getTenantIdFromUser,
} from '@/app/(dashboard)/server-tenant-context'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../app-fixtures'

const cookieJar = vi.hoisted(() => ({ values: new Map<string, string>() }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.values.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))

const payload = createFakePayload()
const andina = buildTenant({ id: 10, name: 'Universidad Andina' })
const caribe = buildTenant({ id: 11, name: 'Universidad del Caribe' })
const superAdmin = buildUser({ id: 2, roles: ['super_admin'], tenant: null })

const selectTenantCookie = (value: string) =>
  cookieJar.values.set(SELECTED_TENANT_COOKIE_NAME, value)

beforeEach(() => {
  cookieJar.values.clear()
  payload.find.mockReset().mockResolvedValue({ docs: [andina, caribe], totalDocs: 2 })
  payload.findByID.mockReset().mockResolvedValue(andina)
})

describe('getTenantIdFromUser', () => {
  it('should read a numeric tenant', () => {
    expect(getTenantIdFromUser(buildUser({ tenant: 10 }))).toBe(10)
  })

  it('should read the id of a populated tenant', () => {
    expect(getTenantIdFromUser(buildUser({ tenant: andina }))).toBe(10)
  })

  it('should return null when the user has no tenant or there is no user', () => {
    expect(getTenantIdFromUser(buildUser({ tenant: null }))).toBeNull()
    expect(getTenantIdFromUser(null)).toBeNull()
  })
})

describe('getServerTenantContext', () => {
  it('should return an empty context when nobody is signed in', async () => {
    const context = await getServerTenantContext(null, payload.asPayload())
    expect(context).toMatchObject({
      selectedTenant: null,
      tenantIdForFilter: null,
      availableTenants: [],
      isViewingAllTenants: false,
    })
  })

  it('should scope a regular user to their own tenant', async () => {
    const manager = buildUser({ tenant: 10 })
    const context = await getServerTenantContext(manager, payload.asPayload())
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'tenants', id: 10 })
    expect(context.selectedTenant).toBe(andina)
    expect(context.availableTenants).toEqual([andina])
    expect(context.tenantIdForFilter).toBe(10)
    expect(context.isViewingAllTenants).toBe(false)
    expect(context.userForQueries.tenant).toBe(10)
  })

  it('should return no tenant for a regular user without one', async () => {
    const context = await getServerTenantContext(buildUser({ tenant: null }), payload.asPayload())
    expect(payload.findByID).not.toHaveBeenCalled()
    expect(context.selectedTenant).toBeNull()
    expect(context.availableTenants).toEqual([])
  })

  it('should let a super admin view all tenants when none is selected', async () => {
    const context = await getServerTenantContext(superAdmin, payload.asPayload())
    expect(context.isViewingAllTenants).toBe(true)
    expect(context.availableTenants).toEqual([andina, caribe])
    expect(context.tenantIdForFilter).toBeNull()
    expect(context.userForQueries).toBe(superAdmin)
  })

  it('should apply the tenant selected through the cookie', async () => {
    selectTenantCookie('11')
    const context = await getServerTenantContext(superAdmin, payload.asPayload())
    expect(context.selectedTenant).toBe(caribe)
    expect(context.tenantIdForFilter).toBe(11)
    expect(context.isViewingAllTenants).toBe(false)
    expect(context.userForQueries.tenant).toBe(11)
  })

  it('should fall back to all tenants when the cookie points to an unknown tenant', async () => {
    selectTenantCookie('999')
    const context = await getServerTenantContext(superAdmin, payload.asPayload())
    expect(context.selectedTenant).toBeNull()
    expect(context.isViewingAllTenants).toBe(true)
  })

  it('should ignore a malformed tenant cookie', async () => {
    selectTenantCookie('not-a-number')
    const context = await getServerTenantContext(superAdmin, payload.asPayload())
    expect(context.isViewingAllTenants).toBe(true)
  })
})

describe('getSelectedTenantIdFromCookie', () => {
  it('should return null without a cookie', async () => {
    await expect(getSelectedTenantIdFromCookie()).resolves.toBeNull()
  })

  it('should return the numeric id of the cookie', async () => {
    selectTenantCookie('10')
    await expect(getSelectedTenantIdFromCookie()).resolves.toBe(10)
  })

  it('should return null for a malformed cookie', async () => {
    selectTenantCookie('abc')
    await expect(getSelectedTenantIdFromCookie()).resolves.toBeNull()
  })
})

describe('createUserForQueriesFromCookie', () => {
  it('should pin a regular user to their tenant regardless of the cookie', async () => {
    selectTenantCookie('11')
    const result = await createUserForQueriesFromCookie(buildUser({ tenant: andina }))
    expect(result.tenant).toBe(10)
  })

  it('should leave a super admin unscoped when no tenant is selected', async () => {
    await expect(createUserForQueriesFromCookie(superAdmin)).resolves.toBe(superAdmin)
  })

  it('should scope a super admin to the selected tenant', async () => {
    selectTenantCookie('11')
    const result = await createUserForQueriesFromCookie(superAdmin)
    expect(result.tenant).toBe(11)
  })
})
