import { describe, expect, it } from 'vitest'
import type { Access, Where } from 'payload'
import { RoleRequests } from '../../plugins/collections'
import { createRoleRequestFormSchema, roleRequestSearchSchema } from '../../schemas'
import { UserRolesEnum } from '@/features/users'
import { createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'

const resolveAccess = async (
  access: Access | undefined,
  user: ReturnType<typeof buildUser> | null,
): Promise<boolean | Where> => {
  if (!access) throw new Error('access function missing')
  const { asRequest } = createFakeRequest({ user })
  return access({ req: asRequest() })
}

const roleRequestAccess = RoleRequests.access

describe('RoleRequests collection access', () => {
  describe('read', () => {
    it('should deny anonymous visitors', async () => {
      expect(await resolveAccess(roleRequestAccess?.read, null)).toBe(false)
    })

    it('should let a SuperAdmin read every request', async () => {
      const user = buildUser({ roles: [UserRolesEnum.SuperAdmin] })
      expect(await resolveAccess(roleRequestAccess?.read, user)).toBe(true)
    })

    it('should deny a non-SuperAdmin without a tenant', async () => {
      const user = buildUser({ roles: [UserRolesEnum.CentralAdmin], tenant: null })
      expect(await resolveAccess(roleRequestAccess?.read, user)).toBe(false)
    })

    it('should scope a Central Admin to the requests of their tenant', async () => {
      const user = buildUser({ roles: [UserRolesEnum.CentralAdmin], tenant: 10 })
      expect(await resolveAccess(roleRequestAccess?.read, user)).toEqual({
        tenant: { equals: 10 },
      })
    })

    it.each([UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager])(
      'should only show a %s their own requests within the tenant',
      async (role) => {
        const user = buildUser({ id: 31, roles: [role], tenant: 10 })
        expect(await resolveAccess(roleRequestAccess?.read, user)).toEqual({
          and: [{ user: { equals: 31 } }, { tenant: { equals: 10 } }],
        })
      },
    )
  })

  describe('create', () => {
    it('should allow any authenticated user and deny anonymous visitors', async () => {
      expect(await resolveAccess(roleRequestAccess?.create, buildUser())).toBe(true)
      expect(await resolveAccess(roleRequestAccess?.create, null)).toBe(false)
    })
  })

  describe('update', () => {
    it.each([
      [UserRolesEnum.SuperAdmin, true],
      [UserRolesEnum.CentralAdmin, true],
      [UserRolesEnum.UnitAdmin, false],
      [UserRolesEnum.SocialMediaManager, false],
    ])('should resolve %s to %s', async (role, expected) => {
      const user = buildUser({ roles: [role] })
      expect(await resolveAccess(roleRequestAccess?.update, user)).toBe(expected)
    })

    it('should deny anonymous visitors', async () => {
      expect(await resolveAccess(roleRequestAccess?.update, null)).toBe(false)
    })
  })

  describe('delete', () => {
    it('should only allow a SuperAdmin to delete', async () => {
      expect(
        await resolveAccess(
          roleRequestAccess?.delete,
          buildUser({ roles: [UserRolesEnum.SuperAdmin] }),
        ),
      ).toBe(true)
      expect(
        await resolveAccess(
          roleRequestAccess?.delete,
          buildUser({ roles: [UserRolesEnum.CentralAdmin] }),
        ),
      ).toBe(false)
      expect(await resolveAccess(roleRequestAccess?.delete, null)).toBe(false)
    })
  })
})

describe('RoleRequests collection definition', () => {
  it('should expose the create and approve endpoints', () => {
    const endpoints = (RoleRequests.endpoints || []).map((e) => `${e.method} ${e.path}`)
    expect(endpoints).toEqual(['post /', 'post /:id/approve'])
  })

  it('should not let people request the SuperAdmin role', () => {
    const field = RoleRequests.fields.find((f) => 'name' in f && f.name === 'requestedRole')
    const values =
      field && field.type === 'select'
        ? field.options.map((o) => (typeof o === 'string' ? o : o.value))
        : []
    expect(values).toEqual([
      UserRolesEnum.UnitAdmin,
      UserRolesEnum.SocialMediaManager,
      UserRolesEnum.CentralAdmin,
    ])
  })

  it('should only show the unit field when a Social Media Manager role is requested', () => {
    const field = RoleRequests.fields.find((f) => 'name' in f && f.name === 'unitId')
    const condition = field?.admin?.condition
    const siblingContext = { blockData: {}, path: [], user: null }
    expect(
      condition?.({ requestedRole: UserRolesEnum.SocialMediaManager }, {}, siblingContext),
    ).toBe(true)
    expect(condition?.({ requestedRole: UserRolesEnum.UnitAdmin }, {}, siblingContext)).toBe(false)
  })
})

describe('role request schemas', () => {
  const valid = {
    requestedRole: UserRolesEnum.UnitAdmin,
    organization: '100',
    justification: 'Necesito administrar la Dirección de Comunicaciones.',
  }

  it('should accept a complete request', () => {
    expect(createRoleRequestFormSchema.safeParse(valid).success).toBe(true)
  })

  it('should reject a justification shorter than 20 characters', () => {
    const result = createRoleRequestFormSchema.safeParse({ ...valid, justification: 'Lo necesito' })
    expect(result.error?.issues[0].message).toBe('Justification must be at least 20 characters')
  })

  it('should reject a justification longer than 500 characters', () => {
    const result = createRoleRequestFormSchema.safeParse({
      ...valid,
      justification: 'a'.repeat(501),
    })
    expect(result.error?.issues[0].message).toBe('Justification must be at most 500 characters')
  })

  it('should require an organization', () => {
    const result = createRoleRequestFormSchema.safeParse({ ...valid, organization: '' })
    expect(result.error?.issues[0].message).toBe('Organization is required')
  })

  it('should only accept known statuses in the search schema', () => {
    expect(roleRequestSearchSchema.safeParse({ status: ['pending', 'approved'] }).success).toBe(
      true,
    )
    expect(roleRequestSearchSchema.safeParse({ status: ['archived'] }).success).toBe(false)
  })
})
