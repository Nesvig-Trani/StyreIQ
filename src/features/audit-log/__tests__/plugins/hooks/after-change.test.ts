// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AuditLogAfterChange from '../../../plugins/hooks/afterChange'
import {
  createFakeCollection,
  createFakePayload,
  createFakeRequest,
} from '@/shared/__tests__/payload-fakes'
import { buildFlag, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const centralAdmin = buildUser({
  id: 2,
  name: 'Rodrigo Salcedo',
  email: 'rodrigo.salcedo@universidad-andina.edu',
  roles: ['central_admin'],
  tenant: 10,
})

type RunOptions = {
  slug: string
  doc: object
  previousDoc?: object
  operation?: 'create' | 'update'
  context?: Record<string, unknown>
  user?: ReturnType<typeof buildUser> | null
}

const run = async ({
  slug,
  doc,
  previousDoc = {},
  operation = 'create',
  context = {},
  user = centralAdmin,
}: RunOptions) => {
  const payload = createFakePayload()
  const { asRequest } = createFakeRequest({ user, payload })
  const result = await AuditLogAfterChange({
    collection: createFakeCollection(slug),
    req: asRequest(),
    doc,
    previousDoc,
    operation,
    context,
  })
  return { payload, result }
}

describe('AuditLogAfterChange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should return the document untouched and defer the audit entry', async () => {
    const doc = buildOrganization({ id: 100 })

    const { payload, result } = await run({ slug: 'organization', doc })

    expect(result).toBe(doc)
    expect(payload.create).not.toHaveBeenCalled()
    await vi.runAllTimersAsync()
    expect(payload.create).toHaveBeenCalledTimes(1)
  })

  it('should log a create entry for an organization scoped to itself and the tenant', async () => {
    const doc = buildOrganization({ id: 100, tenant: 10 })

    const { payload } = await run({ slug: 'organization', doc, previousDoc: {} })
    await vi.runAllTimersAsync()

    expect(payload.create).toHaveBeenCalledWith({
      collection: 'audit_log',
      data: {
        user: 2,
        action: 'create',
        entity: 'organization',
        document: { relationTo: 'organization', value: 100 },
        tenant: 10,
        organizations: [100],
        prev: {},
        current: doc,
      },
    })
  })

  it('should link a user entry to the organizations of that user', async () => {
    const doc = buildUser({ id: 41, organizations: [100, 101], tenant: 10 })

    const { payload } = await run({ slug: 'users', doc })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data).toMatchObject({
      entity: 'users',
      organizations: [100, 101],
      document: { relationTo: 'users', value: 41 },
    })
  })

  it('should link a social media account to its organization', async () => {
    const doc = {
      id: 8,
      name: 'Instagram Universidad Andina',
      tenant: 10,
      organization: buildOrganization({ id: 100 }),
    }

    const { payload } = await run({ slug: 'social-medias', doc })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data).toMatchObject({
      entity: 'social-medias',
      organizations: [100],
    })
  })

  it('should link a flag to the organization it belongs to', async () => {
    const doc = {
      ...buildFlag({ id: 5, tenant: 10 }),
      organization: buildOrganization({ id: 102 }),
    }

    const { payload } = await run({ slug: 'flags', doc })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data.organizations).toEqual([102])
  })

  it('should link a flag comment to the organization of its flag', async () => {
    const doc = {
      id: 9,
      tenant: 10,
      comment: 'Se restableció el acceso a la cuenta.',
      flag: { id: 5, organization: buildOrganization({ id: 103 }) },
    }

    const { payload } = await run({ slug: 'flagComments', doc })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data.organizations).toEqual([103])
  })

  it('should link an organization access grant to its organization', async () => {
    const doc = { id: 12, tenant: 10, organization: buildOrganization({ id: 104 }) }

    const { payload } = await run({ slug: 'organization_access', doc })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data.organizations).toEqual([104])
  })

  it('should not attach organizations for collections without an organization mapping', async () => {
    const doc = { id: 3, tenant: 10, instructions: 'Bienvenido a la Dirección de Comunicaciones' }

    const { payload } = await run({ slug: 'welcome-emails', doc })
    await vi.runAllTimersAsync()

    const data = payload.create.mock.calls[0][0].data
    expect(data).not.toHaveProperty('organizations')
    expect(data).toMatchObject({ entity: 'welcome-emails', action: 'create', tenant: 10 })
  })

  it('should store the previous document as prev on create', async () => {
    const previousDoc = { id: 3, status: 'draft' }

    const { payload } = await run({
      slug: 'welcome-emails',
      doc: { id: 3, tenant: 10, status: 'published' },
      previousDoc,
      operation: 'create',
    })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data.prev).toBe(previousDoc)
  })

  it('should use the snapshot captured before the change as prev on update', async () => {
    const snapshot = { id: 3, tenant: 10, instructions: 'Texto anterior' }
    const doc = { id: 3, tenant: 10, instructions: 'Texto actualizado' }

    const { payload } = await run({
      slug: 'welcome-emails',
      doc,
      previousDoc: { id: 3, instructions: 'ignored by the hook' },
      operation: 'update',
      context: { prev: snapshot },
    })
    await vi.runAllTimersAsync()

    const data = payload.create.mock.calls[0][0].data
    expect(data.action).toBe('update')
    expect(data.prev).toEqual(snapshot)
    expect(data.prev).not.toBe(snapshot)
    expect(data.current).toBe(doc)
  })

  it('should fall back to previousDoc on update when no snapshot was captured', async () => {
    const previousDoc = { id: 3, tenant: 10, instructions: 'Texto anterior' }

    const { payload } = await run({
      slug: 'welcome-emails',
      doc: { id: 3, tenant: 10, instructions: 'Texto actualizado' },
      previousDoc,
      operation: 'update',
    })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data.prev).toBe(previousDoc)
  })

  it('should resolve the tenant from a populated tenant relation on the document', async () => {
    const { payload } = await run({
      slug: 'welcome-emails',
      doc: { id: 3, tenant: { id: 77, name: 'Universidad Andina' } },
    })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data.tenant).toBe(77)
  })

  it('should fall back to the tenant of the user when the document has none', async () => {
    const { payload } = await run({ slug: 'welcome-emails', doc: { id: 3 } })
    await vi.runAllTimersAsync()

    expect(payload.create.mock.calls[0][0].data.tenant).toBe(10)
  })

  it('should not write an audit entry when the change has no authenticated user', async () => {
    const { payload, result } = await run({
      slug: 'organization',
      doc: buildOrganization({ id: 100 }),
      user: null,
    })
    await vi.runAllTimersAsync()

    expect(result).toEqual(buildOrganization({ id: 100 }))
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should swallow and log failures when the audit entry cannot be created', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const payload = createFakePayload()
    const failure = new Error('database unavailable')
    payload.create.mockRejectedValue(failure)
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })

    const doc = buildOrganization({ id: 100 })
    const result = await AuditLogAfterChange({
      collection: createFakeCollection('organization'),
      req: asRequest(),
      doc,
      previousDoc: {},
      operation: 'create',
      context: {},
    })
    await vi.runAllTimersAsync()

    expect(result).toBe(doc)
    expect(consoleError).toHaveBeenCalledWith('Audit log creation failed:', failure)
  })

  it('should swallow errors raised while building the entry for a malformed document', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { payload } = await run({ slug: 'social-medias', doc: { id: 8, tenant: 10 } })
    await vi.runAllTimersAsync()

    expect(payload.create).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith('Audit log creation failed:', expect.any(TypeError))
  })
})
