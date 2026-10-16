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
  it('should return the most recently created welcome email', async () => {
    boundary.payload?.find.mockResolvedValue({
      docs: [{ id: 3, instructions: 'Bienvenida a StyreIQ, Universidad Andina' }],
    })

    const email = await getLastWelcomeEmail()

    expect(email).toEqual({ id: 3, instructions: 'Bienvenida a StyreIQ, Universidad Andina' })
    expect(boundary.payload?.find).toHaveBeenCalledWith({
      collection: 'welcome-emails',
      sort: '-createdAt',
      limit: 1,
    })
  })

  it('should return undefined when no welcome email has been written', async () => {
    expect(await getLastWelcomeEmail()).toBeUndefined()
  })
})
