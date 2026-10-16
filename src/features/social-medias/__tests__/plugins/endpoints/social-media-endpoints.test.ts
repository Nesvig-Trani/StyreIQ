import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import type { FakePayload } from '@/shared/__tests__/payload-fakes'
import { buildSocialMedia } from '../../fixtures'
import {
  createSocialMedia,
  patchSocialMedia,
  updateSocialMediaStatus,
} from '../../../plugins/endpoints'

const context = vi.hoisted(() => ({ payload: null as FakePayload | null }))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: context.payload?.asPayload() }),
}))

type FindByIdArgs = { collection: string; id: number | string }

const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const unitAdmin = buildUser({
  id: 4,
  name: 'Daniela Cárdenas',
  roles: ['unit_admin'],
  tenant: 10,
  organizations: [100],
})
const superAdmin = buildUser({ id: 9, roles: ['super_admin'], tenant: null })

const validBody = {
  name: 'Universidad Andina Oficial',
  profileUrl: 'https://www.instagram.com/uandina_oficial',
  platform: 'instagram',
  creationDate: '2024-03-15',
  organization: '100',
  primaryAdmin: '1',
  backupAdmin: '5',
  adminContactEmails: ['comunicaciones@universidad-andina.edu'],
  thirdPartyManagement: 'no_managed_internally',
  passwordManagementPractice: 'password_manager_shared',
  socialMediaManagers: ['3'],
}

const readJson = async (response: Response) => response.json()

const setupPayload = () => {
  const payload = createFakePayload()
  context.payload = payload
  payload.findByID.mockImplementation(async ({ collection, id }: FindByIdArgs) => {
    if (collection === 'organization') return buildOrganization({ id: Number(id), tenant: 10 })
    if (collection === 'users') {
      return buildUser({
        id: Number(id),
        roles: Number(id) === 3 ? ['social_media_manager'] : ['unit_admin'],
        tenant: 10,
      })
    }
    return null
  })
  payload.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 77, ...data }))
  return payload
}

describe('createSocialMedia endpoint', () => {
  let payload: FakePayload

  beforeEach(() => {
    payload = setupPayload()
  })

  it('should return 400 when the request has no JSON body', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({ error: 'Missing JSON body' })
  })

  it('should return 401 when the user is not signed in', async () => {
    const { asRequest } = createFakeRequest({ user: null, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(401)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 401 when a social media manager tries to create an account directly', async () => {
    const manager = buildUser({ roles: ['social_media_manager'] })
    const { asRequest } = createFakeRequest({ user: manager, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(401)
    expect(await readJson(response)).toEqual({
      error: "You don't have permission to perform this action.",
    })
  })

  it('should return 400 when the payload fails schema validation', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { ...validBody, name: '', adminContactEmails: [] },
    })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(400)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 400 when primary and backup admins are the same person', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { ...validBody, backupAdmin: '1' },
    })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(400)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 403 when the target tenant differs from the user tenant', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { ...validBody, tenant: 99 },
    })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(403)
    expect(await readJson(response)).toEqual({
      error: 'Cannot access social media from different tenant',
    })
  })

  it('should return 404 when the organization does not exist', async () => {
    payload.findByID.mockResolvedValue(null)
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(404)
    expect(await readJson(response)).toEqual({ error: 'Organization not found' })
  })

  it('should return 400 when the organization belongs to another tenant', async () => {
    payload.findByID.mockImplementation(async ({ collection, id }: FindByIdArgs) =>
      collection === 'organization'
        ? buildOrganization({ id: Number(id), tenant: 55 })
        : buildUser({ id: Number(id), roles: ['unit_admin'] }),
    )
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({ error: 'Organization belongs to different tenant' })
  })

  it('should return 404 when a social media manager does not exist', async () => {
    payload.findByID.mockImplementation(async ({ collection, id }: FindByIdArgs) => {
      if (collection === 'organization') return buildOrganization({ id: Number(id) })
      return null
    })
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(404)
    expect(await readJson(response)).toEqual({ error: 'Social Media Manager not found' })
  })

  it('should return 409 when a unit admin picks a unit outside their organizations', async () => {
    payload.find.mockResolvedValue({
      docs: [buildOrganization({ id: 101 })],
      totalDocs: 1,
    })
    const { asRequest } = createFakeRequest({ user: unitAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(409)
    expect(await readJson(response)).toEqual({ error: 'Unit selected is not valid.' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 409 when the primary admin has no admin or manager role', async () => {
    payload.findByID.mockImplementation(async ({ collection, id }: FindByIdArgs) => {
      if (collection === 'organization') return buildOrganization({ id: Number(id) })
      return buildUser({
        id: Number(id),
        roles: Number(id) === 1 ? ['central_admin'] : ['unit_admin'],
      })
    })
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(409)
    expect(await readJson(response)).toEqual({ error: 'Administrator user selected is not valid.' })
  })

  it('should return 409 when the backup admin has no admin or manager role', async () => {
    payload.findByID.mockImplementation(async ({ collection, id }: FindByIdArgs) => {
      if (collection === 'organization') return buildOrganization({ id: Number(id) })
      return buildUser({
        id: Number(id),
        roles: Number(id) === 5 ? ['central_admin'] : ['unit_admin'],
      })
    })
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(409)
    expect(await readJson(response)).toEqual({
      error: 'Backup administrator user selected is not valid.',
    })
  })

  it('should create the account as pending approval with the backup admin when provided', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(201)
    const createArgs = payload.create.mock.calls[0][0]
    expect(createArgs.collection).toBe('social-medias')
    expect(createArgs.data).toMatchObject({
      name: 'Universidad Andina Oficial',
      status: 'pending_approval',
      organization: 100,
      socialMediaManagers: [3],
      adminContactEmails: [{ email: 'comunicaciones@universidad-andina.edu' }],
      tenant: 10,
    })
    expect(createArgs.data.primaryAdmin).toMatchObject({ id: 1 })
    expect(createArgs.data.backupAdmin).toMatchObject({ id: 5 })
  })

  it('should create the account without a backup admin when none is selected', async () => {
    const { backupAdmin: _backupAdmin, ...bodyWithoutBackup } = validBody
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: bodyWithoutBackup,
    })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(201)
    expect(payload.create.mock.calls[0][0].data).not.toHaveProperty('backupAdmin')
  })

  it('should let a unit admin create an account in a unit they can access', async () => {
    payload.find.mockResolvedValue({ docs: [buildOrganization({ id: 100 })], totalDocs: 1 })
    const { asRequest } = createFakeRequest({ user: unitAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(201)
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'organization', overrideAccess: false }),
    )
  })

  it('should let a super admin create an account for any tenant', async () => {
    const { asRequest } = createFakeRequest({
      user: superAdmin,
      payload,
      body: { ...validBody, tenant: 10 },
    })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(201)
    expect(payload.create.mock.calls[0][0].data.tenant).toBe(10)
  })

  it('should return 500 when the database fails unexpectedly', async () => {
    payload.create.mockRejectedValue(new Error('connection reset'))
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload, body: validBody })

    const response = await createSocialMedia.handler(asRequest())

    expect(response.status).toBe(500)
    expect((await readJson(response)).error).toBe('Internal Server Error')
  })
})

describe('patchSocialMedia endpoint', () => {
  let payload: FakePayload

  beforeEach(() => {
    payload = setupPayload()
    payload.findByID.mockResolvedValue(buildSocialMedia({ id: 7, tenant: 10 }))
    payload.update.mockImplementation(async ({ data }: { data: object }) => ({ id: 7, ...data }))
  })

  const patchBody = {
    ...validBody,
    id: 7,
    socialMediaManagers: ['3', '6'],
    status: 'active',
  }

  it('should return 400 when the request has no JSON body', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })

    const response = await patchSocialMedia.handler(asRequest())

    expect(response.status).toBe(400)
  })

  it('should return 404 when the route has no account id', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload, body: patchBody })

    const response = await patchSocialMedia.handler(asRequest())

    expect(response.status).toBe(404)
    expect(await readJson(response)).toEqual({ error: 'Social media not found.' })
  })

  it('should return 400 when the status is not a known value', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { ...patchBody, status: 'archived' },
      routeParams: { id: '7' },
    })

    const response = await patchSocialMedia.handler(asRequest())

    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({ error: 'Status is not valid.' })
  })

  it('should return 403 when the account belongs to another tenant', async () => {
    payload.findByID.mockResolvedValue(buildSocialMedia({ tenant: 55 }))
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: patchBody,
      routeParams: { id: '7' },
    })

    const response = await patchSocialMedia.handler(asRequest())

    expect(response.status).toBe(403)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should clear the backup admin when the form sends an empty value', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { ...patchBody, backupAdmin: '' },
      routeParams: { id: '7' },
    })

    const response = await patchSocialMedia.handler(asRequest())

    expect(response.status).toBe(200)
    const updateArgs = payload.update.mock.calls[0][0]
    expect(updateArgs.data.backupAdmin).toBeNull()
  })

  it('should clear the backup admin when the form omits it entirely', async () => {
    const { backupAdmin: _backupAdmin, ...bodyWithoutBackup } = patchBody
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: bodyWithoutBackup,
      routeParams: { id: '7' },
    })

    await patchSocialMedia.handler(asRequest())

    expect(payload.update.mock.calls[0][0].data.backupAdmin).toBeNull()
  })

  it('should convert ids to numbers, reset status to pending approval and wrap emails', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: patchBody,
      routeParams: { id: '7' },
    })

    const response = await patchSocialMedia.handler(asRequest())

    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'social-medias',
        id: 7,
        data: expect.objectContaining({
          primaryAdmin: 1,
          backupAdmin: 5,
          organization: 100,
          status: 'pending_approval',
          socialMediaManagers: [3, 6],
          adminContactEmails: [{ email: 'comunicaciones@universidad-andina.edu' }],
        }),
      }),
    )
  })

  it('should map the "pending" status alias sent by unit admins', async () => {
    const { asRequest } = createFakeRequest({
      user: unitAdmin,
      payload,
      body: { ...patchBody, status: 'pending' },
      routeParams: { id: '7' },
    })

    const response = await patchSocialMedia.handler(asRequest())

    expect(response.status).toBe(200)
  })

  it('should default contact emails and managers to empty lists when they are not arrays', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { ...patchBody, adminContactEmails: undefined, socialMediaManagers: undefined },
      routeParams: { id: '7' },
    })

    await patchSocialMedia.handler(asRequest())

    const { data } = payload.update.mock.calls[0][0]
    expect(data.adminContactEmails).toEqual([])
    expect(data.socialMediaManagers).toEqual([])
  })

  it('should return 500 when the account lookup fails', async () => {
    payload.findByID.mockRejectedValue(new Error('db down'))
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: patchBody,
      routeParams: { id: '7' },
    })

    const response = await patchSocialMedia.handler(asRequest())

    expect(response.status).toBe(500)
  })
})

describe('updateSocialMediaStatus endpoint', () => {
  let payload: FakePayload

  beforeEach(() => {
    payload = setupPayload()
    payload.findByID.mockResolvedValue(buildSocialMedia({ id: 7, tenant: 10 }))
  })

  it('should return 400 when the request has no JSON body', async () => {
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })

    expect((await updateSocialMediaStatus.handler(asRequest())).status).toBe(400)
  })

  it('should return 404 when the route has no account id', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { status: 'active' },
    })

    expect((await updateSocialMediaStatus.handler(asRequest())).status).toBe(404)
  })

  it('should return 403 when the account belongs to another tenant', async () => {
    payload.findByID.mockResolvedValue(buildSocialMedia({ tenant: 55 }))
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { status: 'active' },
      routeParams: { id: '7' },
    })

    const response = await updateSocialMediaStatus.handler(asRequest())

    expect(response.status).toBe(403)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should return 400 when the status is not a known value', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { status: 'deleted' },
      routeParams: { id: '7' },
    })

    const response = await updateSocialMediaStatus.handler(asRequest())

    expect(response.status).toBe(400)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should store the new status together with the deactivation reason', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: {
        status: 'inactive',
        deactivationReason: 'Cuenta duplicada tras la fusión de facultades',
      },
      routeParams: { id: '7' },
    })

    const response = await updateSocialMediaStatus.handler(asRequest())

    expect(response.status).toBe(200)
    expect(await readJson(response)).toEqual({ message: 'Status updated successfully' })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        data: {
          status: 'inactive',
          deactivationReason: 'Cuenta duplicada tras la fusión de facultades',
        },
      }),
    )
  })

  it('should omit the deactivation reason when none is given', async () => {
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { status: 'active' },
      routeParams: { id: '7' },
    })

    await updateSocialMediaStatus.handler(asRequest())

    expect(payload.update.mock.calls[0][0].data).toEqual({ status: 'active' })
  })

  it('should return 500 when the update fails unexpectedly', async () => {
    payload.update.mockRejectedValue(new Error('timeout'))
    const { asRequest } = createFakeRequest({
      user: centralAdmin,
      payload,
      body: { status: 'active' },
      routeParams: { id: '7' },
    })

    expect((await updateSocialMediaStatus.handler(asRequest())).status).toBe(500)
  })
})
