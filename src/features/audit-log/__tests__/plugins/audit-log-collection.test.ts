import { describe, expect, it } from 'vitest'
import type { Access, Where } from 'payload'
import { AuditLogs } from '../../plugins/collections/audit-log'
import { AuditLogActionEnum } from '../../plugins/types'
import { actionLabels } from '../../constants/actionLabels'
import { auditLogSearchSchema } from '../../schemas'
import { UserRolesEnum } from '@/features/users'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const resolve = async (
  access: Access | undefined,
  user: ReturnType<typeof buildUser> | null,
  payload = createFakePayload(),
): Promise<boolean | Where> => {
  if (!access) throw new Error('access function missing')
  const { asRequest } = createFakeRequest({ user, payload })
  return access({ req: asRequest() })
}

describe('audit_log collection access', () => {
  describe('read', () => {
    it('should deny anonymous visitors', async () => {
      expect(await resolve(AuditLogs.access?.read, null)).toBe(false)
    })

    it('should let a SuperAdmin read every entry', async () => {
      const user = buildUser({ roles: [UserRolesEnum.SuperAdmin] })
      expect(await resolve(AuditLogs.access?.read, user)).toBe(true)
    })

    it('should deny roles without a tenant', async () => {
      const user = buildUser({ roles: [UserRolesEnum.CentralAdmin], tenant: null })
      expect(await resolve(AuditLogs.access?.read, user)).toBe(false)
    })

    it('should scope a Central Admin to their tenant', async () => {
      const user = buildUser({ roles: [UserRolesEnum.CentralAdmin], tenant: 10 })
      expect(await resolve(AuditLogs.access?.read, user)).toEqual({ tenant: { equals: 10 } })
    })

    it('should scope a Unit Admin to the tenant and the units they can access, descendants included', async () => {
      const payload = createFakePayload()
      payload.find
        .mockResolvedValueOnce({ docs: [{ id: 101 }, { id: 102 }] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValue({ docs: [] })
      const user = buildUser({
        roles: [UserRolesEnum.UnitAdmin],
        tenant: 10,
        organizations: [buildOrganization({ id: 100 })],
      })

      const where = await resolve(AuditLogs.access?.read, user, payload)

      expect(where).toEqual({
        and: [{ tenant: { equals: 10 } }, { organizations: { in: [100, 101, 102] } }],
      })
    })

    it('should only show a Social Media Manager the entries they performed', async () => {
      const user = buildUser({ id: 31, roles: [UserRolesEnum.SocialMediaManager], tenant: 10 })
      expect(await resolve(AuditLogs.access?.read, user)).toEqual({
        and: [{ tenant: { equals: 10 } }, { user: { equals: 31 } }],
      })
    })
  })

  describe('write access', () => {
    it('should let any authenticated user create entries but not anonymous visitors', async () => {
      expect(await resolve(AuditLogs.access?.create, buildUser())).toBe(true)
      expect(await resolve(AuditLogs.access?.create, null)).toBe(false)
    })

    it('should never allow updates, not even for a SuperAdmin', async () => {
      const user = buildUser({ roles: [UserRolesEnum.SuperAdmin] })
      expect(await resolve(AuditLogs.access?.update, user)).toBe(false)
    })

    it('should only let a SuperAdmin delete entries', async () => {
      expect(
        await resolve(AuditLogs.access?.delete, buildUser({ roles: [UserRolesEnum.SuperAdmin] })),
      ).toBe(true)
      expect(
        await resolve(AuditLogs.access?.delete, buildUser({ roles: [UserRolesEnum.CentralAdmin] })),
      ).toBe(false)
    })
  })
})

describe('audit_log collection definition', () => {
  it('should offer every audit action in the action field', () => {
    const field = AuditLogs.fields.find((f) => 'name' in f && f.name === 'action')
    const values =
      field && field.type === 'select'
        ? field.options.map((o) => (typeof o === 'string' ? o : o.value))
        : []
    expect([...values].sort()).toEqual(Object.values(AuditLogActionEnum).sort())
  })
})

describe('audit log action labels', () => {
  it('should have a human label for every action', () => {
    Object.values(AuditLogActionEnum).forEach((action) => {
      expect(actionLabels[action]).toBeTruthy()
    })
  })
})

describe('auditLogSearchSchema', () => {
  it('should fall back to empty filters on malformed values', () => {
    const result = auditLogSearchSchema.parse({
      entity: 'users',
      action: 5,
      user: 12,
      createdAt: 'yesterday',
    })
    expect(result).toMatchObject({
      entity: [],
      action: [],
      user: '',
      createdAt: { from: '', to: '' },
    })
  })

  it('should keep valid filters and document ids', () => {
    const result = auditLogSearchSchema.parse({
      entity: ['users'],
      action: ['create'],
      user: '31',
      createdAt: { from: '2026-09-01', to: '2026-09-30' },
      userDocumentId: 31,
      tenant: ['10'],
    })
    expect(result).toMatchObject({
      entity: ['users'],
      action: ['create'],
      user: '31',
      createdAt: { from: '2026-09-01', to: '2026-09-30' },
      userDocumentId: 31,
      tenant: ['10'],
    })
  })
})
