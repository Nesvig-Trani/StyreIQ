import { describe, expect, it } from 'vitest'
import { Tenants } from '@/features/tenants/plugins/collections'
import { createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'

const superAdmin = buildUser({ roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ roles: ['central_admin'], tenant: 10 })

describe('Tenants collection', () => {
  it('should be registered under the tenants slug with the tenant endpoints', () => {
    expect(Tenants.slug).toBe('tenants')
    expect(Tenants.endpoints).toHaveLength(7)
  })

  it('should declare the identifying fields', () => {
    const names = Tenants.fields.flatMap((field) => ('name' in field ? [field.name] : []))
    expect(names).toEqual(
      expect.arrayContaining([
        'name',
        'domain',
        'adminContactEmail',
        'primaryUnit',
        'enabledTrainings',
        'governanceSettings',
        'status',
        'metadata',
      ]),
    )
  })

  describe('read access', () => {
    const read = Tenants.access?.read
    const readAs = (user: ReturnType<typeof buildUser> | null) =>
      read?.({ req: createFakeRequest({ user }).asRequest() })

    it('should deny anonymous users', async () => {
      expect(await readAs(null)).toBe(false)
    })

    it('should let super admins read every tenant', async () => {
      expect(await readAs(superAdmin)).toBe(true)
    })

    it('should restrict other roles to their own tenant document', async () => {
      expect(await readAs(centralAdmin)).toEqual({ id: { equals: 10 } })
    })

    it('should deny users without a tenant', async () => {
      expect(await readAs(buildUser({ roles: ['unit_admin'], tenant: null }))).toBe(false)
    })
  })

  it('should only let super admins create and update tenants and never delete', async () => {
    const asSuper = createFakeRequest({ user: superAdmin }).asRequest()
    const asCentral = createFakeRequest({ user: centralAdmin }).asRequest()
    expect(await Tenants.access?.create?.({ req: asSuper })).toBe(true)
    expect(await Tenants.access?.create?.({ req: asCentral })).toBe(false)
    expect(await Tenants.access?.update?.({ req: asSuper })).toBe(true)
    expect(await Tenants.access?.update?.({ req: asCentral })).toBe(false)
    expect(await Tenants.access?.delete?.({ req: asSuper })).toBe(false)
  })
})
