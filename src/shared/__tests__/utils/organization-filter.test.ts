import { describe, expect, it } from 'vitest'
import {
  getAccessibleOrgIdsForUserWithPayload,
  getAccessibleOrganizationsForUserWithPayload,
  getAccessibleOrganizationsWithPayload,
} from '@/shared/utils/organization-filter'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser as buildGeneratedUser } from '@/shared/__tests__/fixtures'
import type { User } from '@/types/payload-types'

/** Payload's auth `User` is the generated user plus its collection slug. */
const buildUser = (overrides: Partial<User> = {}) => ({
  ...buildGeneratedUser(overrides),
  collection: 'users' as const,
})

const andina = buildOrganization({ id: 100, name: 'Universidad Andina' })
const comunicaciones = buildOrganization({ id: 101, name: 'Dirección de Comunicaciones' })
const biblioteca = buildOrganization({ id: 102, name: 'Biblioteca Central' })

const page = (docs: ReturnType<typeof buildOrganization>[]) => ({
  docs,
  totalDocs: docs.length,
})

describe('getAccessibleOrganizationsWithPayload (tenant isolation, GIQ-85)', () => {
  it('should return nothing when there is no user', async () => {
    const payload = createFakePayload()
    const result = await getAccessibleOrganizationsWithPayload(null, payload.asPayload())
    expect(result).toEqual({ organizations: [], accessibleOrgIds: [] })
    expect(payload.find).not.toHaveBeenCalled()
  })

  describe('super admin', () => {
    const superAdmin = buildUser({ roles: ['super_admin'], tenant: null })

    it('should list organizations of every tenant when no tenant is selected', async () => {
      const payload = createFakePayload()
      payload.find.mockResolvedValue(page([andina, comunicaciones]))
      const result = await getAccessibleOrganizationsWithPayload(superAdmin, payload.asPayload())
      expect(payload.find).toHaveBeenCalledWith({
        collection: 'organization',
        where: {},
        limit: 0,
      })
      expect(result.accessibleOrgIds).toEqual([100, 101])
      expect(result.organizations).toEqual([andina, comunicaciones])
    })

    it('should restrict to the selected tenant', async () => {
      const payload = createFakePayload()
      payload.find.mockResolvedValue(page([andina]))
      await getAccessibleOrganizationsWithPayload(superAdmin, payload.asPayload(), 10)
      expect(payload.find).toHaveBeenCalledWith({
        collection: 'organization',
        where: { tenant: { equals: 10 } },
        limit: 0,
      })
    })
  })

  describe('central admin', () => {
    it('should list every organization of the own tenant only', async () => {
      const payload = createFakePayload()
      payload.find.mockResolvedValue(page([andina, comunicaciones]))
      const user = buildUser({ roles: ['central_admin'], tenant: 10 })
      const result = await getAccessibleOrganizationsWithPayload(
        user,
        payload.asPayload(),
        // a selected tenant must be ignored for non super admins
        99,
      )
      expect(payload.find).toHaveBeenCalledWith({
        collection: 'organization',
        where: { tenant: { equals: 10 } },
        limit: 0,
      })
      expect(result.accessibleOrgIds).toEqual([100, 101])
    })

    it('should return nothing when the user has no tenant', async () => {
      const payload = createFakePayload()
      const user = buildUser({ roles: ['central_admin'], tenant: null })
      const result = await getAccessibleOrganizationsWithPayload(user, payload.asPayload())
      expect(result).toEqual({ organizations: [], accessibleOrgIds: [] })
      expect(payload.find).not.toHaveBeenCalled()
    })
  })

  describe('unit admin', () => {
    it('should include descendants of the assigned units, scoped to the tenant', async () => {
      const payload = createFakePayload()
      payload.find
        .mockResolvedValueOnce(page([comunicaciones]))
        .mockResolvedValueOnce(page([biblioteca]))
        .mockResolvedValueOnce(page([]))
        .mockResolvedValueOnce(page([andina, comunicaciones, biblioteca]))
      const user = buildUser({ roles: ['unit_admin'], tenant: 10, organizations: [andina] })

      const result = await getAccessibleOrganizationsWithPayload(user, payload.asPayload())

      expect(result.accessibleOrgIds).toEqual([100, 101, 102])
      expect(payload.find).toHaveBeenNthCalledWith(1, {
        collection: 'organization',
        where: { parentOrg: { in: [100] } },
        limit: 0,
      })
      expect(payload.find).toHaveBeenNthCalledWith(4, {
        collection: 'organization',
        where: {
          and: [{ id: { in: [100, 101, 102] } }, { tenant: { equals: 10 } }],
        },
        limit: 0,
      })
      expect(result.organizations).toHaveLength(3)
    })

    it('should accept organizations stored as plain ids', async () => {
      const payload = createFakePayload()
      const user = buildUser({ roles: ['unit_admin'], tenant: 10, organizations: [100] })
      const result = await getAccessibleOrganizationsWithPayload(user, payload.asPayload())
      expect(result.accessibleOrgIds).toEqual([100])
    })

    it('should return nothing without assigned organizations or tenant', async () => {
      const payload = createFakePayload()
      const withoutOrgs = buildUser({ roles: ['unit_admin'], tenant: 10, organizations: [] })
      const withoutTenant = buildUser({ roles: ['unit_admin'], tenant: null, organizations: [100] })
      const empty = { organizations: [], accessibleOrgIds: [] }
      expect(await getAccessibleOrganizationsWithPayload(withoutOrgs, payload.asPayload())).toEqual(
        empty,
      )
      expect(
        await getAccessibleOrganizationsWithPayload(withoutTenant, payload.asPayload()),
      ).toEqual(empty)
      expect(payload.find).not.toHaveBeenCalled()
    })
  })

  describe('social media manager', () => {
    it('should only see the directly assigned organizations of the own tenant', async () => {
      const payload = createFakePayload()
      payload.find.mockResolvedValue(page([comunicaciones]))
      const user = buildUser({
        roles: ['social_media_manager'],
        tenant: 10,
        organizations: [comunicaciones],
      })
      const result = await getAccessibleOrganizationsWithPayload(user, payload.asPayload())
      expect(payload.find).toHaveBeenCalledTimes(1)
      expect(payload.find).toHaveBeenCalledWith({
        collection: 'organization',
        where: { and: [{ id: { in: [101] } }, { tenant: { equals: 10 } }] },
        limit: 0,
      })
      expect(result).toEqual({ organizations: [comunicaciones], accessibleOrgIds: [101] })
    })

    it('should return nothing without organizations or tenant', async () => {
      const payload = createFakePayload()
      const withoutOrgs = buildUser({
        roles: ['social_media_manager'],
        tenant: 10,
        organizations: [],
      })
      const withoutTenant = buildUser({
        roles: ['social_media_manager'],
        tenant: null,
        organizations: [101],
      })
      const empty = { organizations: [], accessibleOrgIds: [] }
      expect(await getAccessibleOrganizationsWithPayload(withoutOrgs, payload.asPayload())).toEqual(
        empty,
      )
      expect(
        await getAccessibleOrganizationsWithPayload(withoutTenant, payload.asPayload()),
      ).toEqual(empty)
    })
  })

  it('should honour the active role over the highest role', async () => {
    const payload = createFakePayload()
    const user = buildUser({
      roles: ['central_admin', 'social_media_manager'],
      active_role: 'social_media_manager',
      tenant: 10,
      organizations: [101],
    })
    const result = await getAccessibleOrganizationsWithPayload(user, payload.asPayload())
    expect(result.accessibleOrgIds).toEqual([101])
  })
})

describe('organization-filter convenience wrappers', () => {
  const user = buildUser({ roles: ['central_admin'], tenant: 10 })

  it('should return only the ids', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue(page([andina, biblioteca]))
    expect(await getAccessibleOrgIdsForUserWithPayload(user, payload.asPayload())).toEqual([
      100, 102,
    ])
  })

  it('should return only the organizations', async () => {
    const payload = createFakePayload()
    payload.find.mockResolvedValue(page([andina]))
    expect(await getAccessibleOrganizationsForUserWithPayload(user, payload.asPayload())).toEqual([
      andina,
    ])
  })
})
