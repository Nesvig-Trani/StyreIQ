// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AuditLogAfterDelete, {
  AuditLogAfterDelete as NamedAfterDelete,
} from '../../../plugins/hooks/afterDelete'
import { AuditLogActionEnum } from '../../../plugins/types'
import {
  createFakeCollection,
  createFakePayload,
  createFakeRequest,
} from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({
  id: 2,
  name: 'Rodrigo Salcedo',
  email: 'rodrigo.salcedo@universidad-andina.edu',
  roles: ['central_admin'],
  tenant: 10,
})

const run = async (
  slug: string,
  doc: { id: number; tenant?: number | object | null },
  user: ReturnType<typeof buildUser> | null = centralAdmin,
) => {
  const payload = createFakePayload()
  const { fake, asRequest } = createFakeRequest({ user, payload })
  const result = await AuditLogAfterDelete({
    collection: createFakeCollection(slug),
    req: asRequest(),
    doc,
    id: doc.id,
    context: {},
  })
  return { payload, result, headers: fake.headers }
}

describe('AuditLogAfterDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should expose the same hook as named and default export', () => {
    expect(NamedAfterDelete).toBe(AuditLogAfterDelete)
  })

  it('should return the deleted document and defer the audit entry', async () => {
    const doc = buildOrganization({ id: 100 })

    const { payload, result } = await run('organization', doc)

    expect(result).toBe(doc)
    expect(payload.create).not.toHaveBeenCalled()
    await vi.runAllTimersAsync()
    expect(payload.create).toHaveBeenCalledTimes(1)
  })

  it('should log a delete entry for an organization with the removed document as prev', async () => {
    const doc = buildOrganization({ id: 100, tenant: 10 })

    const { payload } = await run('organization', doc)
    await vi.runAllTimersAsync()

    expect(payload.create).toHaveBeenCalledWith({
      collection: 'audit_log',
      data: {
        user: 2,
        action: AuditLogActionEnum.Delete,
        entity: 'organization',
        prev: doc,
        tenant: 10,
        organizations: [100],
      },
    })
  })

  it('should link a deleted user to the organizations they belonged to', async () => {
    const doc = buildUser({ id: 41, organizations: [100, 101], tenant: 10 })

    const { payload } = await run('users', doc)
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data).toMatchObject({
      action: 'delete',
      entity: 'users',
      organizations: [100, 101],
    })
  })

  it('should not attach organizations for other collections', async () => {
    const { payload } = await run('flags', { id: 5, tenant: 10 })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data).not.toHaveProperty('organizations')
  })

  it('should resolve the tenant from the selected tenant cookie for a SuperAdmin', async () => {
    const payload = createFakePayload()
    const { fake, asRequest } = createFakeRequest({ user: superAdmin, payload })
    fake.headers.set('cookie', 'styreiq_selected_tenant=42')

    await AuditLogAfterDelete({
      collection: createFakeCollection('flags'),
      req: asRequest(),
      doc: { id: 5 },
      id: 5,
      context: {},
    })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data.tenant).toBe(42)
  })

  it('should not write an audit entry when there is no authenticated user', async () => {
    const { payload } = await run('organization', buildOrganization({ id: 100 }), null)
    await vi.runAllTimersAsync()

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should swallow and log failures when the audit entry cannot be created', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const payload = createFakePayload()
    const failure = new Error('database unavailable')
    payload.create.mockRejectedValue(failure)
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })
    const doc = buildOrganization({ id: 100 })

    const result = await AuditLogAfterDelete({
      collection: createFakeCollection('organization'),
      req: asRequest(),
      doc,
      id: 100,
      context: {},
    })
    await vi.runAllTimersAsync()

    expect(result).toBe(doc)
    expect(consoleError).toHaveBeenCalledWith('Audit log creation failed:', failure)
  })
})
