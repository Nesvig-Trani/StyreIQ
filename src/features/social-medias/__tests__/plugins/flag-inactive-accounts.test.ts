import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import type { FakePayload } from '@/shared/__tests__/payload-fakes'
import { buildSocialMedia } from '../fixtures'
import { flagInactiveAccounts } from '../../plugins/tasks/flagInactiveAccounts/flagInactiveAccounts'

const context = vi.hoisted(() => ({ payload: null as FakePayload | null }))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: context.payload?.asPayload() }),
}))

const NOW = new Date('2026-10-16T12:00:00.000Z')
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString()

describe('flagInactiveAccounts', () => {
  let payload: FakePayload

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    payload = createFakePayload()
    context.payload = payload
    payload.find.mockImplementation(async ({ collection }: { collection: string }) =>
      collection === 'tenants'
        ? { docs: [{ id: 10 }, { id: 11 }], totalDocs: 2 }
        : {
            docs: [
              buildSocialMedia({ id: 1, status: 'active', updatedAt: daysAgo(45) }),
              buildSocialMedia({ id: 2, status: 'in_transition', updatedAt: daysAgo(31) }),
              buildSocialMedia({ id: 3, status: 'active', updatedAt: daysAgo(5) }),
              buildSocialMedia({ id: 4, status: 'inactive', updatedAt: daysAgo(90) }),
            ],
            totalDocs: 4,
          },
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should only look at accounts of active tenants that are active or in transition', async () => {
    await flagInactiveAccounts()

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'social-medias',
        where: {
          and: [{ tenant: { in: [10, 11] } }, { status: { in: ['active', 'in_transition'] } }],
        },
      }),
    )
  })

  it('should flag accounts with more than 30 days without updates and create a pending flag', async () => {
    await flagInactiveAccounts()

    const flaggedIds = payload.update.mock.calls.map(([args]) => args.id)
    expect(flaggedIds).toEqual([1, 2])
    expect(payload.update.mock.calls[0][0].data).toEqual({ inactiveFlag: true })
    expect(payload.create).toHaveBeenCalledTimes(2)
    expect(payload.create.mock.calls[0][0]).toMatchObject({
      collection: 'flags',
      data: {
        affectedEntity: { relationTo: 'social-medias', value: 1 },
        organizations: [100],
        status: 'pending',
        tenant: 10,
        description: 'Account has been inactive for 30+ days',
      },
    })
  })

  it('should log every failure without aborting the remaining accounts', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    payload.update.mockRejectedValueOnce(new Error('write conflict'))

    await flagInactiveAccounts()

    expect(payload.update).toHaveBeenCalledTimes(2)
    expect(payload.create).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith(new Error('write conflict'))
  })
})
