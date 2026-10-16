import { describe, expect, it } from 'vitest'
import { Unit } from '@/features/units/plugins/collections/unit.collection'
import { UnitAccess } from '@/features/units/plugins/collections/unit-access.collection'
import { buildAccessibleUnitFilter } from '@/features/units/plugins/utils'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({ id: 3, roles: ['unit_admin'], tenant: 10, organizations: [100] })
const socialManager = buildUser({
  id: 4,
  roles: ['social_media_manager'],
  tenant: 10,
  organizations: [101],
})

describe('Unit collection', () => {
  it('should be exposed as the organization collection with its endpoints', () => {
    expect(Unit.slug).toBe('organization')
    expect(Unit.endpoints).toHaveLength(4)
    expect(Unit.timestamps).toBe(true)
  })

  it('should keep the tenant relation read only and injected automatically', () => {
    const tenantField = Unit.fields.find((field) => 'name' in field && field.name === 'tenant')
    expect(tenantField).toMatchObject({
      type: 'relationship',
      relationTo: 'tenants',
      admin: { readOnly: true },
    })
  })

  describe('read access', () => {
    const read = Unit.access?.read

    it('should deny anonymous users and users without tenant', async () => {
      expect(await read?.({ req: createFakeRequest().asRequest() })).toBe(false)
      const noTenant = buildUser({ roles: ['central_admin'], tenant: null })
      expect(await read?.({ req: createFakeRequest({ user: noTenant }).asRequest() })).toBe(false)
    })

    it('should give super admins full access', async () => {
      expect(await read?.({ req: createFakeRequest({ user: superAdmin }).asRequest() })).toBe(true)
    })

    it('should scope other roles to their tenant and accessible organizations', async () => {
      const payload = createFakePayload()
      payload.find.mockResolvedValue({ docs: [buildOrganization({ id: 100 })], totalDocs: 1 })
      const result = await read?.({ req: createFakeRequest({ user: socialManager }).asRequest() })
      expect(result).toEqual({ tenant: { equals: 10 }, id: { in: [101] } })
    })
  })

  describe('create access', () => {
    it('should reject creating a unit for another tenant', async () => {
      const req = createFakeRequest({ user: centralAdmin }).asRequest()
      expect(await Unit.access?.create?.({ req, data: { tenant: 11 } })).toBe(false)
      expect(await Unit.access?.create?.({ req, data: { tenant: 10 } })).toBe(true)
    })
  })

  describe('update access', () => {
    const update = Unit.access?.update
    const as = (user: ReturnType<typeof buildUser> | null, payload = createFakePayload()) =>
      createFakeRequest({ user, payload }).asRequest()

    it('should deny anonymous requests and missing ids', async () => {
      expect(await update?.({ req: as(null), id: 5 })).toBe(false)
      expect(await update?.({ req: as(centralAdmin) })).toBe(false)
    })

    it('should allow super admins and deny users without tenant', async () => {
      expect(await update?.({ req: as(superAdmin), id: 5 })).toBe(true)
      const noTenant = buildUser({ roles: ['central_admin'], tenant: null })
      expect(await update?.({ req: as(noTenant), id: 5 })).toBe(false)
    })

    it('should deny moving a unit to another tenant', async () => {
      expect(await update?.({ req: as(centralAdmin), id: 5, data: { tenant: 11 } })).toBe(false)
    })

    it('should scope central admins to their tenant', async () => {
      expect(await update?.({ req: as(centralAdmin), id: 5 })).toEqual({
        tenant: { equals: 10 },
      })
    })

    it('should not let unit admins edit main units', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildOrganization({ id: 100, parentOrg: null }))
      expect(await update?.({ req: as(unitAdmin, payload), id: 100 })).toBe(false)
    })

    it('should let unit admins edit sub-units they can access', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildOrganization({ id: 101, parentOrg: 100 }))
      payload.find
        .mockResolvedValueOnce({ docs: [{ id: 101 }] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
      expect(await update?.({ req: as(unitAdmin, payload), id: 101 })).toBe(true)
    })

    it('should not let unit admins edit sub-units outside their branch', async () => {
      const payload = createFakePayload()
      payload.findByID.mockResolvedValue(buildOrganization({ id: 500, parentOrg: 400 }))
      expect(await update?.({ req: as(unitAdmin, payload), id: 500 })).toBe(false)
    })

    it('should deny social media managers', async () => {
      expect(await update?.({ req: as(socialManager), id: 101 })).toBe(false)
    })
  })

  it('should let only super admins delete units', async () => {
    const del = Unit.access?.delete
    expect(await del?.({ req: createFakeRequest({ user: superAdmin }).asRequest() })).toBe(true)
    expect(await del?.({ req: createFakeRequest({ user: centralAdmin }).asRequest() })).toBe(false)
  })
})

describe('UnitAccess collection', () => {
  it('should link users to organizations with a temporary or permanent type', () => {
    expect(UnitAccess.slug).toBe('organization_access')
    const type = UnitAccess.fields.find((field) => 'name' in field && field.name === 'type')
    expect(type).toMatchObject({
      type: 'select',
      options: [
        { label: 'Temporary', value: 'temporary' },
        { label: 'Permanent', value: 'permanent' },
      ],
    })
  })
})

describe('buildAccessibleUnitFilter', () => {
  it('should match each organization and its descendants while skipping disabled units', () => {
    const where = buildAccessibleUnitFilter({
      orgs: [buildOrganization({ id: 100 }), buildOrganization({ id: 101 })],
    })
    expect(where).toEqual({
      and: [
        {
          or: [
            { id: { equals: 100 } },
            { path: { contains: 100 } },
            { id: { equals: 101 } },
            { path: { contains: 101 } },
          ],
        },
        { disabled: { not_equals: true } },
      ],
    })
  })
})
