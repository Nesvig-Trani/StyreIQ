import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@/types/payload-types'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import type { FakePayload } from '@/shared/__tests__/payload-fakes'
import { buildSocialMedia } from '../fixtures'
import {
  SocialMediaPosts,
  SocialMedias,
  SocialMediasCollectionSlug,
} from '../../plugins/collections'

type UserRole = User['roles'][number]

const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({ id: 4, roles: ['unit_admin'], tenant: 10, organizations: [100] })
const manager = buildUser({
  id: 3,
  roles: ['social_media_manager'],
  tenant: 10,
  organizations: [100],
})
const superAdmin = buildUser({ id: 9, roles: ['super_admin'], tenant: null })

const access = SocialMedias.access
if (!access?.read || !access.create || !access.update || !access.delete) {
  throw new Error('SocialMedias collection must define read, create, update and delete access')
}
const { read, create, update, remove } = {
  read: access.read,
  create: access.create,
  update: access.update,
  remove: access.delete,
}

// The unit admin owns unit 100; unit 150 is its only child (first lookup), then the tree ends.
const buildPayloadWithChildUnit = (): FakePayload => {
  const payload = createFakePayload()
  payload.find
    .mockResolvedValueOnce({ docs: [buildOrganization({ id: 150 })], totalDocs: 1 })
    .mockResolvedValue({ docs: [], totalDocs: 0 })
  return payload
}

describe('SocialMedias read access', () => {
  it('should deny anonymous visitors', async () => {
    const { asRequest } = createFakeRequest({ user: null })

    expect(await read({ req: asRequest() })).toBe(false)
  })

  it('should grant super admins full access', async () => {
    const { asRequest } = createFakeRequest({ user: superAdmin })

    expect(await read({ req: asRequest() })).toBe(true)
  })

  it('should deny users without a tenant', async () => {
    const { asRequest } = createFakeRequest({
      user: buildUser({ roles: ['central_admin'], tenant: null }),
    })

    expect(await read({ req: asRequest() })).toBe(false)
  })

  it('should scope central admins to their tenant', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin })

    expect(await read({ req: asRequest() })).toEqual({ tenant: { equals: 10 } })
  })

  it('should scope unit admins to their tenant and accessible organizations', async () => {
    const payload = buildPayloadWithChildUnit()
    const { asRequest } = createFakeRequest({ user: unitAdmin, payload })

    const result = await read({ req: asRequest() })

    expect(result).toEqual({
      and: [{ tenant: { equals: 10 } }, { organization: { in: [100, 150] } }],
    })
  })

  it('should scope managers to accounts they manage or administer', async () => {
    const { asRequest } = createFakeRequest({ user: manager })

    expect(await read({ req: asRequest() })).toEqual({
      and: [
        { tenant: { equals: 10 } },
        {
          or: [
            { socialMediaManagers: { contains: 3 } },
            { primaryAdmin: { equals: 3 } },
            { backupAdmin: { equals: 3 } },
          ],
        },
      ],
    })
  })
})

describe('SocialMedias create access', () => {
  it('should deny anonymous visitors', async () => {
    const { asRequest } = createFakeRequest({ user: null })

    expect(await create({ req: asRequest() })).toBe(false)
  })

  it('should let super admins create anywhere', async () => {
    const { asRequest } = createFakeRequest({ user: superAdmin })

    expect(await create({ req: asRequest(), data: { tenant: 55 } })).toBe(true)
  })

  it('should deny users without a tenant', async () => {
    const { asRequest } = createFakeRequest({
      user: buildUser({ roles: ['central_admin'], tenant: null }),
    })

    expect(await create({ req: asRequest() })).toBe(false)
  })

  it('should deny creating in a different tenant', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin })

    expect(await create({ req: asRequest(), data: { tenant: 55 } })).toBe(false)
  })

  it('should accept a tenant given as a populated relation', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin })

    expect(
      await create({
        req: asRequest(),
        data: { tenant: { id: 10, name: 'Universidad Andina' } },
      }),
    ).toBe(true)
  })

  it('should let central admins create inside their tenant', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin })

    expect(await create({ req: asRequest(), data: { tenant: 10 } })).toBe(true)
  })

  it('should require an organization for unit admins', async () => {
    const { asRequest } = createFakeRequest({ user: unitAdmin })

    expect(await create({ req: asRequest(), data: {} })).toBe(false)
  })

  it('should let unit admins create in an owned or descendant unit and deny others', async () => {
    const payload = buildPayloadWithChildUnit()
    const { asRequest } = createFakeRequest({ user: unitAdmin, payload })

    expect(await create({ req: asRequest(), data: { organization: 150 } })).toBe(true)
    expect(await create({ req: asRequest(), data: { organization: 101 } })).toBe(false)
  })

  it('should require an organization for managers', async () => {
    const { asRequest } = createFakeRequest({ user: manager })

    expect(await create({ req: asRequest(), data: {} })).toBe(false)
  })

  it('should deny managers creating outside their organizations', async () => {
    const { asRequest } = createFakeRequest({ user: manager })

    expect(await create({ req: asRequest(), data: { organization: 200 } })).toBe(false)
  })

  it('should let managers create pending accounts in their unit', async () => {
    const { asRequest } = createFakeRequest({ user: manager })

    expect(
      await create({ req: asRequest(), data: { organization: 100, status: 'pending_approval' } }),
    ).toBe(true)
    expect(await create({ req: asRequest(), data: { organization: { id: 100 } } })).toBe(true)
  })

  it('should not let managers create accounts that are already active', async () => {
    const { asRequest } = createFakeRequest({ user: manager })

    expect(await create({ req: asRequest(), data: { organization: 100, status: 'active' } })).toBe(
      false,
    )
  })
})

describe('SocialMedias update and delete access', () => {
  let payload: FakePayload

  beforeEach(() => {
    payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildSocialMedia({ id: 7, tenant: 10 }))
  })

  it('should let central admins update accounts of their tenant', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })

    expect(await update({ req: asRequest(), id: '7' })).toBe(true)
  })

  it('should deny central admins updating accounts of another tenant', async () => {
    payload.findByID.mockResolvedValue(buildSocialMedia({ tenant: 55 }))
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })

    expect(await update({ req: asRequest(), id: '7' })).toBe(false)
  })

  it('should deny unit admins updating through the Payload API', async () => {
    const { asRequest } = createFakeRequest({ user: unitAdmin, payload })

    expect(await update({ req: asRequest(), id: '7' })).toBe(false)
  })

  it('should deny deleting for anonymous visitors', async () => {
    const { asRequest } = createFakeRequest({ user: null, payload })

    expect(await remove({ req: asRequest(), id: '7' })).toBe(false)
  })
})

describe('SocialMedias isSharedCredential field access', () => {
  const sharedField = SocialMedias.fields.find(
    (field) => 'name' in field && field.name === 'isSharedCredential',
  )
  const updateAccess =
    sharedField && 'access' in sharedField ? sharedField.access?.update : undefined

  const cases: [UserRole, boolean][] = [
    ['super_admin', true],
    ['central_admin', true],
    ['unit_admin', true],
    ['social_media_manager', false],
  ]

  it.each(cases)('should resolve %s to %s', async (role, expected) => {
    const { asRequest } = createFakeRequest({ user: buildUser({ roles: [role] }) })

    expect(await updateAccess?.({ req: asRequest() })).toBe(expected)
  })

  it('should deny anonymous visitors', async () => {
    const { asRequest } = createFakeRequest({ user: null })

    expect(await updateAccess?.({ req: asRequest() })).toBe(false)
  })
})

describe('SocialMedias collection definition', () => {
  it('should expose the social-medias slug and the account endpoints', () => {
    expect(SocialMedias.slug).toBe(SocialMediasCollectionSlug)
    const endpoints = Array.isArray(SocialMedias.endpoints) ? SocialMedias.endpoints : []
    expect(endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)).toEqual([
      'post /',
      'get /latest-post',
      'patch /:id',
      'patch /status/:id',
      'get /saved-latest-post',
    ])
  })

  it('should leave the backup admin optional so it can be cleared', () => {
    const backupAdmin = SocialMedias.fields.find(
      (field) => 'name' in field && field.name === 'backupAdmin',
    )

    expect(backupAdmin).toMatchObject({ type: 'relationship', required: false })
  })

  it('should require the primary admin', () => {
    const primaryAdmin = SocialMedias.fields.find(
      (field) => 'name' in field && field.name === 'primaryAdmin',
    )

    expect(primaryAdmin).toMatchObject({ required: true })
  })
})

describe('SocialMediaPosts collection', () => {
  const postAccess = SocialMediaPosts.access

  it('should be registered under the social-media-posts slug', () => {
    expect(SocialMediaPosts.slug).toBe('social-media-posts')
  })

  it('should require the platform, author, content, url and publication date', () => {
    const required = SocialMediaPosts.fields
      .filter((field) => 'required' in field && field.required)
      .map((field) => 'name' in field && field.name)

    expect(required).toEqual(
      expect.arrayContaining([
        'platform',
        'socialMedia',
        'externalId',
        'author',
        'content',
        'url',
        'publishedAt',
        'scrapedAt',
      ]),
    )
  })

  it('should stamp scrapedAt with the current date by default', () => {
    const scrapedAt = SocialMediaPosts.fields.find(
      (field) => 'name' in field && field.name === 'scrapedAt',
    )
    const defaultValue = scrapedAt && 'defaultValue' in scrapedAt ? scrapedAt.defaultValue : null

    expect(typeof defaultValue).toBe('function')
  })

  it('should allow reading, creating and updating but never deleting posts', async () => {
    const { asRequest } = createFakeRequest({ user: null })
    const args = { req: asRequest() }

    expect(await postAccess?.read?.(args)).toBe(true)
    expect(await postAccess?.create?.(args)).toBe(true)
    expect(await postAccess?.update?.(args)).toBe(true)
    expect(await postAccess?.delete?.(args)).toBe(false)
  })
})
