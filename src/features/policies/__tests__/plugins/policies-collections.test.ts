import { describe, expect, it } from 'vitest'
import type { Access, Where } from 'payload'
import { Acknowledgments, Policies } from '../../plugins/collections'
import { UserRolesEnum } from '@/features/users'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

type FakeUser = ReturnType<typeof buildUser> | null

const resolve = async (
  access: Access | undefined,
  user: FakeUser,
  {
    payload = createFakePayload(),
    data,
    cookie,
  }: {
    payload?: ReturnType<typeof createFakePayload>
    data?: Record<string, unknown>
    cookie?: string
  } = {},
): Promise<boolean | Where> => {
  if (!access) throw new Error('access function missing')
  const { asRequest, fake } = createFakeRequest({ user, payload })
  if (cookie) fake.headers.set('cookie', cookie)
  return access({ req: asRequest(), data })
}

describe('Policies collection access', () => {
  const access = Policies.access

  it('should scope reads to the tenant of the user', async () => {
    const user = buildUser({ roles: [UserRolesEnum.UnitAdmin], tenant: 10 })
    expect(await resolve(access?.read, user)).toEqual({ tenant: { equals: 10 } })
  })

  it('should let a Central Admin create policies for their own tenant only', async () => {
    const admin = buildUser({ roles: [UserRolesEnum.CentralAdmin], tenant: 10 })
    expect(await resolve(access?.create, admin, { data: { tenant: 10 } })).toBe(true)
    expect(await resolve(access?.create, admin, { data: { tenant: 11 } })).toBe(false)
  })

  it('should not let a Unit Admin create or update policies', async () => {
    const unitAdmin = buildUser({ roles: [UserRolesEnum.UnitAdmin], tenant: 10 })
    expect(await resolve(access?.create, unitAdmin)).toBe(false)
    expect(await resolve(access?.update, unitAdmin)).toBe(false)
  })

  it('should require a SuperAdmin to have a tenant selected to create policies', async () => {
    const superAdmin = buildUser({ roles: [UserRolesEnum.SuperAdmin] })
    expect(await resolve(access?.create, superAdmin)).toBe(false)
    expect(
      await resolve(access?.create, superAdmin, { cookie: 'styreiq_selected_tenant=10' }),
    ).toBe(true)
  })

  it('should only let a SuperAdmin delete policies', async () => {
    expect(await resolve(access?.delete, buildUser({ roles: [UserRolesEnum.SuperAdmin] }))).toBe(
      true,
    )
    expect(await resolve(access?.delete, buildUser({ roles: [UserRolesEnum.CentralAdmin] }))).toBe(
      false,
    )
  })
})

describe('Acknowledgments collection access', () => {
  const access = Acknowledgments.access

  it('should deny anonymous visitors', async () => {
    expect(await resolve(access?.read, null)).toBe(false)
  })

  it('should let a SuperAdmin read every acknowledgment', async () => {
    expect(await resolve(access?.read, buildUser({ roles: [UserRolesEnum.SuperAdmin] }))).toBe(true)
  })

  it('should deny users without a tenant', async () => {
    const user = buildUser({ roles: [UserRolesEnum.CentralAdmin], tenant: null })
    expect(await resolve(access?.read, user)).toBe(false)
  })

  it('should let a Central Admin read the acknowledgments of every user in the tenant', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue({ docs: [{ id: 31 }, { id: 32 }] })
    const user = buildUser({ roles: [UserRolesEnum.CentralAdmin], tenant: 10 })

    expect(await resolve(access?.read, user, { payload })).toEqual({
      tenant: { equals: 10 },
      user: { in: [31, 32] },
    })
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'users',
      where: { tenant: { equals: 10 } },
      limit: 0,
    })
  })

  it('should let a Unit Admin read the acknowledgments of users in their units', async () => {
    const payload = createFakePayload()
    payload.find.mockImplementation(async ({ collection }: { collection: string }) => ({
      docs: collection === 'users' ? [{ id: 33 }] : [],
    }))
    const user = buildUser({
      roles: [UserRolesEnum.UnitAdmin],
      tenant: 10,
      organizations: [buildOrganization({ id: 100 })],
    })

    expect(await resolve(access?.read, user, { payload })).toEqual({
      tenant: { equals: 10 },
      user: { in: [33] },
    })
  })

  it('should only show a Social Media Manager their own acknowledgments', async () => {
    const user = buildUser({ id: 31, roles: [UserRolesEnum.SocialMediaManager], tenant: 10 })
    expect(await resolve(access?.read, user)).toEqual({
      tenant: { equals: 10 },
      user: { equals: 31 },
    })
  })

  it('should let authenticated users acknowledge, never edit, and only a SuperAdmin delete', async () => {
    const manager = buildUser({ roles: [UserRolesEnum.SocialMediaManager] })
    expect(await resolve(access?.create, manager)).toBe(true)
    expect(await resolve(access?.create, null)).toBe(false)
    expect(await resolve(access?.update, buildUser({ roles: [UserRolesEnum.SuperAdmin] }))).toBe(
      false,
    )
    expect(await resolve(access?.delete, manager)).toBe(false)
  })
})
