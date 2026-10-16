import { describe, expect, it } from 'vitest'
import type { CollectionConfig } from 'payload'
import { Flags, FlagComments, FlagHistory } from '@/features/flags/plugins/collections'
import { WelcomeEmails } from '@/features/welcome-emails/plugins/collections'
import { RoleRequests } from '@/features/role-request/plugins/collections'
import { AuditLogs } from '@/features/audit-log/plugins/collections/audit-log'
import { buildUser } from '@/shared/__tests__/fixtures'
import { runTenantFieldHook } from './tenant-field-hook-runner'

const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({
  id: 2,
  name: 'Rodrigo Salcedo',
  email: 'rodrigo.salcedo@universidad-andina.edu',
  roles: ['central_admin'],
  tenant: 10,
})
const manager = buildUser({ id: 3, roles: ['social_media_manager'], tenant: 10 })

const collections: Array<[string, CollectionConfig]> = [
  ['flags', Flags],
  ['flagComments', FlagComments],
  ['flagHistory', FlagHistory],
  ['welcome-emails', WelcomeEmails],
  ['role-requests', RoleRequests],
  ['audit_log', AuditLogs],
]

describe.each(collections)('%s tenant field beforeChange hook', (_name, collection) => {
  it('should keep the tenant value that was already provided', async () => {
    const result = await runTenantFieldHook(collection, {
      user: centralAdmin,
      operation: 'create',
      value: 25,
    })
    expect(result).toBe(25)
  })

  it('should assign the tenant of a tenant user when creating without a value', async () => {
    const result = await runTenantFieldHook(collection, {
      user: centralAdmin,
      operation: 'create',
      value: null,
    })
    expect(result).toBe(10)
  })

  it('should assign the tenant of a social media manager on create', async () => {
    const result = await runTenantFieldHook(collection, {
      user: manager,
      operation: 'create',
      value: undefined,
    })
    expect(result).toBe(10)
  })

  it('should use the tenant selected in the cookie when a SuperAdmin creates', async () => {
    const result = await runTenantFieldHook(collection, {
      user: superAdmin,
      operation: 'create',
      value: null,
      selectedTenantCookie: '42',
    })
    expect(result).toBe(42)
  })

  it('should leave the tenant empty when a SuperAdmin creates without a selected tenant', async () => {
    const result = await runTenantFieldHook(collection, {
      user: superAdmin,
      operation: 'create',
      value: null,
    })
    expect(result).toBeNull()
  })

  it('should return the tenant sent in the data when updating', async () => {
    const result = await runTenantFieldHook(collection, {
      user: centralAdmin,
      operation: 'update',
      value: null,
      data: { tenant: 12 },
    })
    expect(result).toBe(12)
  })

  it('should keep the stored tenant on update when no tenant is sent', async () => {
    const result = await runTenantFieldHook(collection, {
      user: centralAdmin,
      operation: 'update',
      value: null,
      data: {},
    })
    expect(result).toBeNull()
  })

  it('should not inject a tenant for anonymous requests', async () => {
    const result = await runTenantFieldHook(collection, {
      user: null,
      operation: 'create',
      value: null,
    })
    expect(result).toBeNull()
  })
})
