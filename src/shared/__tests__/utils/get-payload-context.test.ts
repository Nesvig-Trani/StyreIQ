import { describe, expect, it, vi } from 'vitest'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'

const fakePayload = createFakePayload()
const getPayload = vi.fn()
const fakeConfig = Promise.resolve({ collections: [] })

vi.mock('payload', () => ({ getPayload: (args: unknown) => getPayload(args) }))
vi.mock('@/lib/payload/payload.config', () => ({ default: fakeConfig }))

describe('getPayloadContext', () => {
  it('should initialise Payload with the project config and return the instance', async () => {
    getPayload.mockResolvedValue(fakePayload.asPayload())
    const { payload } = await getPayloadContext()
    expect(getPayload).toHaveBeenCalledWith({ config: fakeConfig })
    expect(payload).toBe(fakePayload.asPayload())
  })
})
