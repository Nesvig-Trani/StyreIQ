import { describe, expect, it } from 'vitest'
import type { Access, CollectionConfig } from 'payload'
import { FlagComments, FlagHistory, Flags } from '../../plugins/collections'
import { createFlag, createComment, markAsResolved } from '../../plugins/endpoints'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'
import type { User } from '@/types/payload-types'

const fieldNames = (collection: CollectionConfig) =>
  collection.fields.map((field) => ('name' in field ? field.name : undefined))

const runAccess = async (access: Access | undefined, user: User | null, id?: string) => {
  const { asRequest } = createFakeRequest({ user })
  return access?.({ req: asRequest(), id })
}

const superAdmin = buildUser({ roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({ roles: ['unit_admin'], tenant: 10 })
const manager = buildUser({ roles: ['social_media_manager'], tenant: 10 })

describe('Flags collection', () => {
  it('should be registered under the flags slug with its endpoints', () => {
    expect(Flags.slug).toBe('flags')
    expect(Flags.endpoints).toEqual([createFlag, markAsResolved])
  })

  it('should store the data the risk flow depends on', () => {
    expect(fieldNames(Flags)).toEqual(
      expect.arrayContaining([
        'flagType',
        'affectedEntity',
        'accountUrl',
        'accountPlatform',
        'accessIssue',
        'organizations',
        'assignedTo',
        'dueDate',
        'status',
        'detectionDate',
        'source',
        'lastActivity',
        'history',
        'tenant',
        'relatedComplianceTask',
      ]),
    )
  })

  it('should default new flags to pending', () => {
    const status = Flags.fields.find((f) => 'name' in f && f.name === 'status')
    expect(status && 'defaultValue' in status && status.defaultValue).toBe('pending')
  })

  it('should let only super admins delete flags', async () => {
    expect(await runAccess(Flags.access?.delete, superAdmin)).toBe(true)
    expect(await runAccess(Flags.access?.delete, centralAdmin)).toBe(false)
    expect(await runAccess(Flags.access?.delete, null)).toBe(false)
  })

  it('should let admins update flags but not social media managers', async () => {
    expect(await runAccess(Flags.access?.update, centralAdmin)).toBe(true)
    expect(await runAccess(Flags.access?.update, unitAdmin)).toBe(true)
    expect(await runAccess(Flags.access?.update, manager)).toBe(false)
  })

  it('should keep flags unreadable for anonymous visitors and scoped to the tenant for admins', async () => {
    expect(await runAccess(Flags.access?.read, null)).toBe(false)
    expect(await runAccess(Flags.access?.read, centralAdmin)).toEqual({ tenant: { equals: 10 } })
  })
})

describe('FlagComments collection', () => {
  it('should expose the comment endpoint', () => {
    expect(FlagComments.slug).toBe('flagComments')
    expect(FlagComments.endpoints).toEqual([createComment])
  })

  it('should let any signed-in user comment but not anonymous visitors', async () => {
    expect(await runAccess(FlagComments.access?.create, manager)).toBe(true)
    expect(await runAccess(FlagComments.access?.create, null)).toBe(false)
  })

  it('should only let the author edit their own comment', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue({ id: 301, user: manager.id })
    const { asRequest } = createFakeRequest({ user: manager, payload })

    expect(await FlagComments.access?.update?.({ req: asRequest(), id: '301' })).toBe(true)

    payload.findByID.mockResolvedValue({ id: 301, user: 999 })
    expect(await FlagComments.access?.update?.({ req: asRequest(), id: '301' })).toBe(false)
  })

  it('should scope reads to the tenant', async () => {
    expect(await runAccess(FlagComments.access?.read, manager)).toEqual({
      tenant: { equals: 10 },
    })
  })
})

describe('FlagHistory collection', () => {
  it('should be immutable once written', async () => {
    expect(await runAccess(FlagHistory.access?.update, superAdmin)).toBe(false)
  })

  it('should record the three kinds of history actions', () => {
    const action = FlagHistory.fields.find((f) => 'name' in f && f.name === 'action')
    const values =
      action && 'options' in action
        ? action.options.map((o) => (typeof o === 'string' ? o : o.value))
        : []
    expect(values).toEqual(['created', 'status_changed', 'comment'])
  })

  it('should only let super admins delete history entries', async () => {
    expect(await runAccess(FlagHistory.access?.delete, centralAdmin)).toBe(false)
    expect(await runAccess(FlagHistory.access?.delete, superAdmin)).toBe(true)
  })
})
