import { describe, expect, it } from 'vitest'
import type { Access, Where } from 'payload'
import { WelcomeEmails } from '../../plugins/collections'
import { WelcomeEmailCollectionSlug } from '../../plugins/types'
import { UserRolesEnum } from '@/features/users'
import { createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'

const resolve = async (
  access: Access | undefined,
  user: ReturnType<typeof buildUser> | null,
  data?: Record<string, unknown>,
): Promise<boolean | Where> => {
  if (!access) throw new Error('access function missing')
  const { asRequest } = createFakeRequest({ user })
  return access({ req: asRequest(), data })
}

describe('WelcomeEmails collection', () => {
  it('should use the welcome-emails slug', () => {
    expect(WelcomeEmails.slug).toBe(WelcomeEmailCollectionSlug)
  })

  it('should require instructions and keep policy links well formed', () => {
    const instructions = WelcomeEmails.fields.find((f) => 'name' in f && f.name === 'instructions')
    expect(instructions).toMatchObject({ type: 'textarea', required: true })

    const links = WelcomeEmails.fields.find((f) => 'name' in f && f.name === 'policyLinks')
    const names =
      links && links.type === 'array'
        ? links.fields.map((f) => ('name' in f ? f.name : undefined))
        : []
    expect(names).toEqual(['id', 'title', 'url'])
  })

  it('should scope reads to the tenant of the user', async () => {
    const user = buildUser({ roles: [UserRolesEnum.SocialMediaManager], tenant: 10 })
    expect(await resolve(WelcomeEmails.access?.read, user)).toEqual({ tenant: { equals: 10 } })
    expect(await resolve(WelcomeEmails.access?.read, null)).toBe(false)
  })

  it('should let Central Admins create and update but not Unit Admins', async () => {
    const central = buildUser({ roles: [UserRolesEnum.CentralAdmin], tenant: 10 })
    const unit = buildUser({ roles: [UserRolesEnum.UnitAdmin], tenant: 10 })
    expect(await resolve(WelcomeEmails.access?.create, central, { tenant: 10 })).toBe(true)
    expect(await resolve(WelcomeEmails.access?.update, central)).toBe(true)
    expect(await resolve(WelcomeEmails.access?.create, unit)).toBe(false)
    expect(await resolve(WelcomeEmails.access?.update, unit)).toBe(false)
  })

  it('should only let a SuperAdmin delete welcome emails', async () => {
    expect(
      await resolve(WelcomeEmails.access?.delete, buildUser({ roles: [UserRolesEnum.SuperAdmin] })),
    ).toBe(true)
    expect(
      await resolve(
        WelcomeEmails.access?.delete,
        buildUser({ roles: [UserRolesEnum.CentralAdmin] }),
      ),
    ).toBe(false)
  })
})
