import { describe, expect, it } from 'vitest'
import type { FieldHookArgs } from 'payload'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'
import { createFakeCollection, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../tenant-fixtures'

const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })

type HookInput = {
  user?: ReturnType<typeof buildUser> | null
  operation?: 'create' | 'update' | 'read'
  value?: unknown
  data?: Record<string, unknown>
  cookie?: string
}

const run = ({ user = null, operation = 'create', value, data, cookie }: HookInput) => {
  const { asRequest, fake } = createFakeRequest({ user })
  if (cookie) fake.headers.set('cookie', cookie)
  const args: FieldHookArgs = {
    blockData: undefined,
    collection: createFakeCollection('organization'),
    context: {},
    data,
    field: { name: 'tenant', type: 'relationship', relationTo: 'tenants' },
    global: null,
    indexPath: [],
    operation,
    path: ['tenant'],
    req: asRequest(),
    schemaPath: ['tenant'],
    siblingData: {},
    siblingFields: [],
    value,
  }
  return injectTenantHook(args)
}

describe('injectTenantHook', () => {
  it('should keep a tenant value that is already set, whatever the role', async () => {
    expect(await run({ user: centralAdmin, value: 11 })).toBe(11)
    expect(
      await run({ user: superAdmin, value: 12, cookie: `${SELECTED_TENANT_COOKIE_NAME}=10` }),
    ).toBe(12)
  })

  describe('on create', () => {
    it('should leave the value empty for anonymous requests', async () => {
      expect(await run({ user: null })).toBeUndefined()
    })

    it('should use the tenant selected through the cookie for super admins', async () => {
      expect(await run({ user: superAdmin, cookie: `${SELECTED_TENANT_COOKIE_NAME}=10` })).toBe(10)
    })

    it('should return null for super admins who have not selected a tenant', async () => {
      expect(await run({ user: superAdmin })).toBeNull()
      expect(
        await run({ user: superAdmin, cookie: `${SELECTED_TENANT_COOKIE_NAME}=abc` }),
      ).toBeNull()
    })

    it('should ignore the selected tenant cookie for non super admins', async () => {
      expect(await run({ user: centralAdmin, cookie: `${SELECTED_TENANT_COOKIE_NAME}=99` })).toBe(
        10,
      )
    })

    it('should inject the tenant of a central admin', async () => {
      expect(await run({ user: centralAdmin })).toBe(10)
    })

    it('should resolve the id when the user tenant is a populated relation', async () => {
      const unitAdmin = buildUser({
        roles: ['unit_admin'],
        tenant: buildTenant({ id: 14, name: 'Universidad Andina' }),
      })
      expect(await run({ user: unitAdmin })).toBe(14)
    })

    it('should leave the value empty for tenant-less non super admins', async () => {
      const orphan = buildUser({ roles: ['social_media_manager'], tenant: null })
      expect(await run({ user: orphan })).toBeUndefined()
    })

    it('should honour the active role instead of every assigned role', async () => {
      const dualRole = buildUser({
        roles: ['super_admin', 'central_admin'],
        active_role: 'central_admin',
        tenant: 10,
      })
      expect(await run({ user: dualRole, cookie: `${SELECTED_TENANT_COOKIE_NAME}=99` })).toBe(10)
    })
  })

  describe('on update', () => {
    it('should take the tenant from the submitted data', async () => {
      expect(await run({ user: centralAdmin, operation: 'update', data: { tenant: 10 } })).toBe(10)
    })

    it('should fall back to the current value when the data has no tenant', async () => {
      expect(
        await run({ user: centralAdmin, operation: 'update', data: { name: 'Radio' } }),
      ).toBeUndefined()
      expect(await run({ user: centralAdmin, operation: 'update' })).toBeUndefined()
    })
  })

  it('should return the value untouched for other operations', async () => {
    expect(
      await run({ user: centralAdmin, operation: 'read', data: { tenant: 5 } }),
    ).toBeUndefined()
  })
})
