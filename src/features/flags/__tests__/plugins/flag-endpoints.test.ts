import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createComment, createFlag, markAsResolved } from '../../plugins/endpoints'
import { createFakePayload, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import { buildFlag, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const centralAdmin = buildUser({ id: 7, roles: ['central_admin'], tenant: 10 })
const superAdmin = buildUser({ id: 1, roles: ['super_admin'], tenant: null })

const validUserFlagBody = {
  flagType: 'security_concern',
  affectedEntityType: 'users',
  affectedEntity: '42',
  description: 'Shared password circulated in WhatsApp group',
  suggestedAction: 'Rotate the password and enable 2FA',
  assignedTo: '7',
  dueDate: '2026-11-15',
}

const validLostAccountBody = {
  flagType: 'lost_inaccessible_account',
  accountUrl: 'https://instagram.com/uandina_artes',
  accountPlatform: 'instagram',
  accessIssue: '  Former manager left without handing over credentials ',
  organization: '100',
  description: 'Account inaccessible',
  suggestedAction: 'Request recovery through Meta',
  assignedTo: '7',
  dueDate: '2026-11-15',
}

const readJson = async (response: Response | undefined) => response?.json()

describe('createFlag endpoint', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const setup = (body: unknown, user = centralAdmin) => {
    const payload = createFakePayload()
    payload.create.mockImplementation(async ({ collection }) =>
      collection === 'flags'
        ? buildFlag({ id: 55, tenant: 10, assignedTo: 7, dueDate: '2026-11-15' })
        : { id: 900 },
    )
    const { asRequest } = createFakeRequest({ user, payload, body })
    return { payload, req: asRequest() }
  }

  it('should return 400 when the request has no JSON body', async () => {
    const { req } = setup(undefined)
    const response = await createFlag.handler(req)
    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({ error: 'Missing JSON body' })
  })

  it('should return 400 when there is no authenticated user', async () => {
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({ user: null, payload, body: validUserFlagBody })
    const response = await createFlag.handler(asRequest())
    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({ error: 'Missing user' })
  })

  it('should return 400 when the payload fails schema validation', async () => {
    const { req, payload } = setup({ ...validUserFlagBody, assignedTo: '' })
    const response = await createFlag.handler(req)
    expect(response.status).toBe(400)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return 403 when the target tenant differs from the user tenant', async () => {
    const { req } = setup({ ...validUserFlagBody, tenant: 99 })
    const response = await createFlag.handler(req)
    expect(response.status).toBe(403)
    expect(await readJson(response)).toEqual({
      error: 'Cannot access flag from different tenant',
    })
  })

  it('should return 400 when a non-super admin has no tenant', async () => {
    const { req } = setup(validUserFlagBody, buildUser({ roles: ['central_admin'], tenant: null }))
    const response = await createFlag.handler(req)
    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({ error: 'User has no tenant assigned' })
  })

  it('should return 404 when the affected entity does not exist', async () => {
    const { req, payload } = setup(validUserFlagBody)
    payload.findByID.mockResolvedValue(null)
    const response = await createFlag.handler(req)
    expect(response.status).toBe(404)
    expect(await readJson(response)).toEqual({ error: 'Affected entity not found' })
  })

  it('should return 400 when the affected entity belongs to another tenant', async () => {
    const { req, payload } = setup(validUserFlagBody)
    payload.findByID.mockResolvedValue(buildUser({ id: 42, tenant: 77 }))
    const response = await createFlag.handler(req)
    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({
      error: 'Affected entity belongs to different tenant',
    })
  })

  it('should create a flag for a user, inherit their organizations and log history', async () => {
    const { req, payload } = setup(validUserFlagBody)
    payload.findByID.mockImplementation(async ({ collection }) =>
      collection === 'users' ? buildUser({ id: 42, tenant: 10, organizations: [100, 101] }) : null,
    )

    const response = await createFlag.handler(req)

    expect(response.status).toBe(201)
    const flagCall = payload.create.mock.calls.find(([arg]) => arg.collection === 'flags')?.[0]
    expect(flagCall.data).toMatchObject({
      flagType: 'security_concern',
      status: 'pending',
      affectedEntity: { relationTo: 'users', value: 42 },
      organizations: [100, 101],
      assignedTo: 7,
      createdBy: 7,
      source: 'manual',
      detectionDate: '2026-10-16T12:00:00.000Z',
      lastActivity: '2026-10-16T12:00:00.000Z',
    })
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'flagHistory',
      data: { flag: 55, user: 7, action: 'created' },
    })
  })

  it('should use the organization of the social media account as flag organization', async () => {
    const { req, payload } = setup({
      ...validUserFlagBody,
      affectedEntityType: 'social-medias',
      affectedEntity: '31',
    })
    payload.findByID.mockResolvedValue({ id: 31, tenant: 10, organization: 100 })

    const response = await createFlag.handler(req)

    expect(response.status).toBe(201)
    const flagCall = payload.create.mock.calls.find(([arg]) => arg.collection === 'flags')?.[0]
    expect(flagCall.data.organizations).toEqual([100])
    expect(flagCall.data.affectedEntity).toEqual({ relationTo: 'social-medias', value: 31 })
  })

  it('should create a review task and email the assignee after creating the flag', async () => {
    const { req, payload } = setup(validUserFlagBody)
    payload.findByID.mockResolvedValue(
      buildUser({ id: 42, tenant: 10, organizations: [100], email: 'camilo.ortiz@uandina.edu' }),
    )

    await createFlag.handler(req)

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'compliance_tasks',
        data: expect.objectContaining({ relatedFlag: 55, assignedUser: 7, tenant: 10 }),
      }),
    )
  })

  it('should still return 201 when the follow-up task generation fails', async () => {
    const { req, payload } = setup(validUserFlagBody)
    payload.findByID.mockResolvedValue(buildUser({ id: 42, tenant: 10, organizations: [100] }))
    payload.find.mockRejectedValue(new Error('database unavailable'))

    const response = await createFlag.handler(req)

    expect(response.status).toBe(201)
    expect(console.error).toHaveBeenCalled()
  })

  it('should return 400 when no entity is selected for a regular flag', async () => {
    const { req } = setup({ ...validUserFlagBody, affectedEntity: '0' })
    const response = await createFlag.handler(req)
    expect(response.status).toBe(400)
  })

  describe('lost or inaccessible account flags', () => {
    it('should store the trimmed account details and the selected unit', async () => {
      const { req, payload } = setup(validLostAccountBody)
      payload.findByID.mockResolvedValue(buildOrganization({ id: 100, tenant: 10 }))

      const response = await createFlag.handler(req)

      expect(response.status).toBe(201)
      const flagCall = payload.create.mock.calls.find(([arg]) => arg.collection === 'flags')?.[0]
      expect(flagCall.data).toMatchObject({
        accountUrl: 'https://instagram.com/uandina_artes',
        accountPlatform: 'instagram',
        accessIssue: 'Former manager left without handing over credentials',
        organizations: [100],
      })
      expect(flagCall.data.affectedEntity).toBeUndefined()
    })

    it('should return 404 when the selected unit does not exist', async () => {
      const { req, payload } = setup(validLostAccountBody)
      payload.findByID.mockResolvedValue(null)
      const response = await createFlag.handler(req)
      expect(response.status).toBe(404)
      expect(await readJson(response)).toEqual({ error: 'Unit not found' })
    })

    it('should return 403 when a unit admin files the flag under a unit they do not manage', async () => {
      const unitAdmin = buildUser({
        id: 8,
        roles: ['unit_admin'],
        tenant: 10,
        organizations: [buildOrganization({ id: 200 })],
      })
      const { req, payload } = setup(validLostAccountBody, unitAdmin)
      payload.findByID.mockResolvedValue(buildOrganization({ id: 100, tenant: 10 }))
      // first lookup finds descendant units (none), the second loads the accessible units
      payload.find
        .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
        .mockResolvedValueOnce({ docs: [buildOrganization({ id: 200 })], totalDocs: 1 })

      const response = await createFlag.handler(req)

      expect(response.status).toBe(403)
      expect(await readJson(response)).toEqual({ error: 'You do not have access to this unit' })
    })

    it('should allow a unit admin to file the flag under their own unit', async () => {
      const unitAdmin = buildUser({
        id: 8,
        roles: ['unit_admin'],
        tenant: 10,
        organizations: [buildOrganization({ id: 100 })],
      })
      const { req, payload } = setup(validLostAccountBody, unitAdmin)
      payload.findByID.mockResolvedValue(buildOrganization({ id: 100, tenant: 10 }))
      // first lookup finds descendant units (none), the second loads the accessible units
      payload.find
        .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
        .mockResolvedValueOnce({ docs: [buildOrganization({ id: 100 })], totalDocs: 1 })

      const response = await createFlag.handler(req)

      expect(response.status).toBe(201)
    })

    it('should reject a javascript: account url', async () => {
      const { req } = setup({ ...validLostAccountBody, accountUrl: 'javascript:alert(1)' })
      const response = await createFlag.handler(req)
      expect(response.status).toBe(400)
    })
  })

  it('should return 500 when the database fails unexpectedly', async () => {
    const { req, payload } = setup(validUserFlagBody)
    payload.findByID.mockRejectedValue(new Error('connection reset'))
    const response = await createFlag.handler(req)
    expect(response.status).toBe(500)
    expect((await readJson(response)).error).toBe('Internal Server Error')
  })

  it('should let a super admin create a flag without a tenant on the request', async () => {
    const { req, payload } = setup(validUserFlagBody, superAdmin)
    payload.findByID.mockResolvedValue(buildUser({ id: 42, tenant: 10, organizations: [100] }))
    const response = await createFlag.handler(req)
    expect(response.status).toBe(201)
  })
})

describe('markAsResolved endpoint', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  const setup = ({
    user = superAdmin,
    body = {},
    routeParams = { id: '55' } as Record<string, string>,
  } = {}) => {
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({ user, payload, body, routeParams })
    return { payload, req: asRequest() }
  }

  it('should return 400 when there is no JSON body', async () => {
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({ user: superAdmin, payload })
    const response = await markAsResolved.handler(asRequest())
    expect(response.status).toBe(400)
  })

  it('should return 404 when the flag id is missing from the route', async () => {
    const { req } = setup({ routeParams: {} })
    const response = await markAsResolved.handler(req)
    expect(response.status).toBe(404)
  })

  it('should return 500 when the user is not a super admin', async () => {
    const { req, payload } = setup({ user: centralAdmin })
    const response = await markAsResolved.handler(req)
    expect(response.status).toBe(500)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('should return 404 when the flag does not exist', async () => {
    const { req } = setup()
    const response = await markAsResolved.handler(req)
    expect(response.status).toBe(404)
    expect(await readJson(response)).toEqual({ error: 'No flag id' })
  })

  it('should resolve the flag and record the status change in the history', async () => {
    const { req, payload } = setup()
    payload.findByID.mockResolvedValue(buildFlag({ id: 55, status: 'pending', tenant: 10 }))
    payload.update.mockResolvedValue({ docs: [{ id: 55, status: 'resolved' }] })

    const response = await markAsResolved.handler(req)

    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'flags',
        where: { id: { equals: 55 } },
        data: { status: 'resolved' },
      }),
    )
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'flagHistory',
      data: {
        flag: 55,
        user: 1,
        action: 'status_changed',
        prevStatus: 'pending',
        newStatus: 'resolved',
      },
    })
  })
})

describe('createComment endpoint', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  const setup = (body: unknown, user: typeof centralAdmin | null = centralAdmin) => {
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({ user, payload, body })
    return { payload, req: asRequest() }
  }

  it('should return 400 when there is no JSON body', async () => {
    const payload = createFakePayload()
    const { asRequest } = createFakeRequest({ user: centralAdmin, payload })
    const response = await createComment.handler(asRequest())
    expect(response.status).toBe(400)
  })

  it('should return 403 when the user is not authenticated', async () => {
    const { req } = setup({ flagId: 55, comment: 'Ya contacté al administrador' }, null)
    const response = await createComment.handler(req)
    expect(response.status).toBe(403)
  })

  it('should return 400 when the payload is invalid', async () => {
    const { req } = setup({ flagId: 'abc', comment: 'Seguimiento' })
    const response = await createComment.handler(req)
    expect(response.status).toBe(400)
  })

  it('should return 404 when the flag does not exist', async () => {
    const { req } = setup({ flagId: 55, comment: 'Seguimiento' })
    const response = await createComment.handler(req)
    expect(response.status).toBe(404)
  })

  it('should return 403 when the flag belongs to another tenant', async () => {
    const { req, payload } = setup({ flagId: 55, comment: 'Seguimiento' })
    payload.findByID.mockResolvedValue(buildFlag({ id: 55, tenant: 99 }))
    const response = await createComment.handler(req)
    expect(response.status).toBe(403)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should store the comment and add a comment entry to the history', async () => {
    const { req, payload } = setup({ flagId: 55, comment: 'Ya contacté al administrador' })
    payload.findByID.mockResolvedValue(buildFlag({ id: 55, tenant: 10 }))
    payload.create.mockResolvedValueOnce({ id: 301, comment: 'Ya contacté al administrador' })

    const response = await createComment.handler(req)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 301, comment: 'Ya contacté al administrador' })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'flagComments',
        data: { comment: 'Ya contacté al administrador', flag: 55, user: 7 },
      }),
    )
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'flagHistory',
      data: { flag: 55, user: 7, action: 'comment' },
    })
  })

  it('should return 500 when saving the comment fails', async () => {
    const { req, payload } = setup({ flagId: 55, comment: 'Seguimiento' })
    payload.findByID.mockResolvedValue(buildFlag({ id: 55, tenant: 10 }))
    payload.create.mockRejectedValue(new Error('write failed'))
    const response = await createComment.handler(req)
    expect(response.status).toBe(500)
  })
})
