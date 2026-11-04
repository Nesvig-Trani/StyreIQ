import { getLastWelcomeEmail } from '../../plugins/queries'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'

const boundary = vi.hoisted(() => ({
  payload: undefined as
    | undefined
    | ReturnType<typeof import('@/shared/__tests__/payload-fakes').createFakePayload>,
}))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: boundary.payload }),
}))

beforeEach(() => {
  boundary.payload = createFakePayload()
})

describe('getLastWelcomeEmail', () => {
  it('should return the most recent welcome email of the given tenant', async () => {
    boundary.payload?.find.mockResolvedValue({
      docs: [{ id: 3, instructions: 'Bienvenida a StyreIQ, Universidad Andina' }],
    })

    const email = await getLastWelcomeEmail(7)

    expect(email).toEqual({ id: 3, instructions: 'Bienvenida a StyreIQ, Universidad Andina' })
    expect(boundary.payload?.find).toHaveBeenCalledWith({
      collection: 'welcome-emails',
      where: { tenant: { equals: 7 } },
      sort: '-createdAt',
      limit: 1,
    })
  })

  it('should return undefined when the tenant has not written a welcome email', async () => {
    expect(await getLastWelcomeEmail(7)).toBeUndefined()
  })

  it('should not read any welcome email when there is no tenant', async () => {
    expect(await getLastWelcomeEmail(null)).toBeUndefined()
    expect(await getLastWelcomeEmail(undefined)).toBeUndefined()
    expect(boundary.payload?.find).not.toHaveBeenCalled()
  })
})
