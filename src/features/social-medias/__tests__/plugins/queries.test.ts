import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/types/payload-types'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import type { FakePayload } from '@/shared/__tests__/payload-fakes'
import { buildSocialMedia } from '../fixtures'
import {
  getAllSocialMediaAccounts,
  getSocialMediaAccounts,
  getSocialMediaAccountsCount,
  getSocialMediaById,
} from '../../plugins/queries'

const context = vi.hoisted(() => ({
  payload: null as FakePayload | null,
  user: null as User | null,
  cookies: {} as Record<string, string>,
}))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: context.payload?.asPayload() }),
}))
vi.mock('@/features/auth/utils/getAuthUser', () => ({
  getAuthUser: async () => ({ headers: new Headers(), user: context.user }),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name in context.cookies ? { value: context.cookies[name] } : undefined),
  }),
}))

const superAdmin = buildUser({ id: 9, roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({
  id: 4,
  roles: ['unit_admin'],
  organizations: [100, buildOrganization({ id: 101 })],
})
const manager = buildUser({ id: 3, roles: ['social_media_manager'] })

let payload: FakePayload

beforeEach(() => {
  payload = createFakePayload()
  context.payload = payload
  context.user = null
  context.cookies = {}
})

const lastFindArgs = () => payload.find.mock.calls[0][0]

describe('getAllSocialMediaAccounts', () => {
  it('should return an empty page when nobody is signed in', async () => {
    const result = await getAllSocialMediaAccounts()

    expect(result.docs).toEqual([])
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should bypass access control for super admins and scope to the selected tenant', async () => {
    context.user = superAdmin
    context.cookies = { styreiq_selected_tenant: '10' }

    await getAllSocialMediaAccounts()

    expect(lastFindArgs()).toMatchObject({
      collection: 'social-medias',
      where: { tenant: { equals: 10 } },
      overrideAccess: true,
    })
  })

  it('should keep access control on for tenant-bound users', async () => {
    context.user = centralAdmin

    await getAllSocialMediaAccounts()

    expect(lastFindArgs()).toMatchObject({ where: {}, overrideAccess: false })
  })
})

describe('getSocialMediaAccountsCount', () => {
  beforeEach(() => {
    payload.find.mockResolvedValue({ docs: [], totalDocs: 12 })
  })

  it('should return 0 when nobody is signed in', async () => {
    expect(await getSocialMediaAccountsCount()).toBe(0)
  })

  it('should count only the selected tenant for super admins', async () => {
    context.user = superAdmin
    context.cookies = { styreiq_selected_tenant: '10' }

    expect(await getSocialMediaAccountsCount()).toBe(12)
    expect(lastFindArgs().where).toEqual({ tenant: { equals: 10 } })
  })

  it('should count every tenant for super admins without a selected tenant', async () => {
    context.user = superAdmin

    await getSocialMediaAccountsCount()

    expect(lastFindArgs().where).toEqual({})
  })

  it('should restrict unit admins to the organizations they belong to', async () => {
    context.user = unitAdmin

    await getSocialMediaAccountsCount()

    expect(lastFindArgs().where).toEqual({ 'organization.id': { in: [100, 101] } })
  })

  it('should match nothing for unit admins without organizations', async () => {
    context.user = buildUser({ roles: ['unit_admin'], organizations: [] })

    await getSocialMediaAccountsCount()

    expect(lastFindArgs().where).toEqual({ 'organization.id': { in: [-1] } })
  })

  it('should restrict social media managers to the accounts they manage', async () => {
    context.user = manager

    await getSocialMediaAccountsCount()

    expect(lastFindArgs().where).toEqual({ socialMediaManagers: { in: [3] } })
  })

  it('should not add filters for central admins', async () => {
    context.user = centralAdmin

    await getSocialMediaAccountsCount()

    expect(lastFindArgs().where).toEqual({})
  })
})

describe('getSocialMediaAccounts', () => {
  const paging = { pageSize: 10, pageIndex: 2 }

  it('should return an empty page when nobody is signed in', async () => {
    const result = await getSocialMediaAccounts(paging)

    expect(result.totalDocs).toBe(0)
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should paginate with one-based pages and apply status, platform and admin filters', async () => {
    context.user = centralAdmin

    await getSocialMediaAccounts({
      ...paging,
      status: ['active'],
      platform: ['instagram'],
      primaryAdmin: ['1', '4'],
      organization: ['100'],
    })

    expect(lastFindArgs()).toMatchObject({
      limit: 10,
      page: 3,
      overrideAccess: false,
      where: {
        status: { in: ['active'] },
        platform: { in: ['instagram'] },
        'primaryAdmin.id': { in: [1, 4] },
        'organization.id': { in: [100] },
      },
    })
  })

  it('should let super admins filter by tenant list and organization', async () => {
    context.user = superAdmin
    context.cookies = { styreiq_selected_tenant: '10' }

    await getSocialMediaAccounts({ ...paging, tenant: ['11', '12'], organization: ['100'] })

    expect(lastFindArgs()).toMatchObject({
      overrideAccess: true,
      where: { tenant: { in: [11, 12] }, 'organization.id': { in: [100] } },
    })
  })

  it('should use the selected tenant cookie for super admins without a tenant filter', async () => {
    context.user = superAdmin
    context.cookies = { styreiq_selected_tenant: '10' }

    await getSocialMediaAccounts(paging)

    expect(lastFindArgs().where).toEqual({ tenant: { equals: 10 } })
  })

  it('should ignore a non-numeric tenant cookie', async () => {
    context.user = superAdmin
    context.cookies = { styreiq_selected_tenant: 'abc' }

    await getSocialMediaAccounts(paging)

    expect(lastFindArgs().where).toEqual({})
  })

  it('should intersect the requested organizations with the unit admin organizations', async () => {
    context.user = unitAdmin

    await getSocialMediaAccounts({ ...paging, organization: ['100', '999'] })

    expect(lastFindArgs().where).toMatchObject({ 'organization.id': { in: [100] } })
  })

  it('should match nothing when a unit admin asks for organizations they do not belong to', async () => {
    context.user = unitAdmin

    await getSocialMediaAccounts({ ...paging, organization: ['999'] })

    expect(lastFindArgs().where).toMatchObject({ 'organization.id': { in: [-1] } })
  })

  it('should default to all of the unit admin organizations', async () => {
    context.user = unitAdmin

    await getSocialMediaAccounts(paging)

    expect(lastFindArgs().where).toMatchObject({ 'organization.id': { in: [100, 101] } })
  })

  it('should restrict social media managers to their accounts', async () => {
    context.user = manager

    await getSocialMediaAccounts(paging)

    expect(lastFindArgs().where).toMatchObject({ socialMediaManagers: { in: [3] } })
  })
})

describe('getSocialMediaById', () => {
  it('should look the account up by id', async () => {
    payload.findByID.mockResolvedValue(buildSocialMedia({ id: 7 }))

    const result = await getSocialMediaById({ id: 7 })

    expect(result.name).toBe('Universidad Andina Oficial')
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'social-medias', id: 7 })
  })
})
