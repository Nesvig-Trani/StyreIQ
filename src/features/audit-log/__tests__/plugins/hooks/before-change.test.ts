import { describe, expect, it } from 'vitest'
import AuditLogBeforeChange from '../../../plugins/hooks/beforeChange'
import {
  createFakeCollection,
  createFakePayload,
  createFakeRequest,
} from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })

describe('AuditLogBeforeChange', () => {
  it('should capture the stored document in the context before an update', async () => {
    const stored = buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(stored)
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })
    const context: Record<string, unknown> = {}
    const data = { name: 'Dirección de Comunicaciones y Prensa' }

    const result = await AuditLogBeforeChange({
      collection: createFakeCollection('organization'),
      context,
      data,
      originalDoc: stored,
      operation: 'update',
      req: asRequest(),
    })

    expect(payload.findByID).toHaveBeenCalledWith({
      collection: 'organization',
      id: 100,
      depth: 2,
    })
    expect(context.prev).toBe(stored)
    expect(result).toBe(data)
  })

  it('should not query the database when creating a document', async () => {
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })
    const context: Record<string, unknown> = {}
    const data = { name: 'Oficina de Admisiones' }

    const result = await AuditLogBeforeChange({
      collection: createFakeCollection('organization'),
      context,
      data,
      originalDoc: undefined,
      operation: 'create',
      req: asRequest(),
    })

    expect(payload.findByID).not.toHaveBeenCalled()
    expect(context).not.toHaveProperty('prev')
    expect(result).toBe(data)
  })

  it('should not query the database when the original document has no id', async () => {
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })
    const context: Record<string, unknown> = {}

    await AuditLogBeforeChange({
      collection: createFakeCollection('organization'),
      context,
      data: { name: 'Oficina de Admisiones' },
      originalDoc: { name: 'Oficina de Admisiones' },
      operation: 'update',
      req: asRequest(),
    })

    expect(payload.findByID).not.toHaveBeenCalled()
    expect(context).not.toHaveProperty('prev')
  })

  it('should propagate lookup failures so the update is aborted', async () => {
    const payload = createFakePayload()
    payload.findByID.mockRejectedValue(new Error('Not Found'))
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })

    await expect(
      AuditLogBeforeChange({
        collection: createFakeCollection('organization'),
        context: {},
        data: {},
        originalDoc: { id: 100 },
        operation: 'update',
        req: asRequest(),
      }),
    ).rejects.toThrow('Not Found')
  })
})
