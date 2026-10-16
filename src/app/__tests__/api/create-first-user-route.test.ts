import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/create-first-user/route'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'

const payload = createFakePayload()

vi.mock('@/lib/payload/payload.config', () => ({ default: {} }))
vi.mock('payload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('payload')>()),
  getPayload: async () => payload.asPayload(),
}))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: payload.asPayload() }),
}))

const jsonRequest = (body: unknown) =>
  new Request('https://app.styreiq.test/api/create-first-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const founder = {
  name: 'Valentina Restrepo',
  email: 'valentina.restrepo@universidad-andina.edu',
  password: 'Andina#2026',
}

const givenUserCount = (totalDocs: number) =>
  payload.find.mockImplementation(async ({ collection }: { collection: string }) => ({
    docs: collection === 'organization' && totalDocs > 0 ? [{ id: 1 }] : [],
    totalDocs: collection === 'users' ? totalDocs : 0,
  }))

beforeEach(() => {
  payload.find.mockReset()
  payload.create.mockReset()
  payload.create.mockResolvedValue({ id: 77 })
})

describe('POST /api/create-first-user', () => {
  it('should create the first user as an active super admin and seed the StyreIQ organization', async () => {
    givenUserCount(0)
    const response = await POST(jsonRequest(founder))

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ id: 77 })
    expect(payload.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({
          email: 'valentina.restrepo@universidad-andina.edu',
          roles: ['super_admin'],
          active_role: 'super_admin',
          status: 'active',
        }),
      }),
    )
    expect(payload.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'organization',
        data: expect.objectContaining({ name: 'StyreIQ', admin: 77, path: '77', depth: 0 }),
      }),
    )
  })

  it('should not duplicate the StyreIQ organization when it already exists', async () => {
    payload.find.mockImplementation(async ({ collection }: { collection: string }) => ({
      docs: collection === 'organization' ? [{ id: 1 }] : [],
      totalDocs: 0,
    }))
    const response = await POST(jsonRequest(founder))
    expect(response.status).toBe(201)
    expect(payload.create).toHaveBeenCalledOnce()
  })

  it('should refuse once the platform already has users', async () => {
    givenUserCount(3)
    const response = await POST(jsonRequest(founder))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'This action is not permitted.' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should answer 400 when the body is missing', async () => {
    givenUserCount(0)
    const response = await POST(
      new Request('https://app.styreiq.test/api/create-first-user', { method: 'POST' }),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing JSON body' })
  })

  it('should answer 400 when the password is too short', async () => {
    givenUserCount(0)
    const response = await POST(jsonRequest({ ...founder, password: 'corta' }))
    expect(response.status).toBe(400)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should answer 400 with a generic message when Payload fails', async () => {
    givenUserCount(0)
    payload.create.mockRejectedValue(new Error('duplicate key value'))
    const response = await POST(jsonRequest(founder))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Error creating the first user.' })
  })
})
