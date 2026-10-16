import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'

const fakePayload = vi.hoisted(() => ({
  current: null as ReturnType<typeof createFakePayload> | null,
  authUser: null as { id: number; tenant?: number | { id: number } | null } | null,
}))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: fakePayload.current!.asPayload() }),
}))
vi.mock('@/features/auth/utils/getAuthUser', () => ({
  getAuthUser: async () => ({ headers: new Headers(), user: fakePayload.authUser }),
}))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

import {
  getComplianceTasksByUserIds,
  getComplianceTasksForUser,
  getTaskForUser,
  getTaskForUserWithAccounts,
  getTaskForUserWithFlag,
  getTrainingInfo,
} from '../../plugins/queries'

describe('compliance task queries', () => {
  let payload: ReturnType<typeof createFakePayload>
  const member = buildUser({ id: 7, tenant: 10 })

  beforeEach(() => {
    payload = createFakePayload()
    fakePayload.current = payload
    fakePayload.authUser = member
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('getComplianceTasksForUser', () => {
    it('should query open tasks assigned to the user sorted by due date', async () => {
      await getComplianceTasksForUser(7)

      expect(payload.find).toHaveBeenCalledWith({
        collection: 'compliance_tasks',
        where: {
          assignedUser: { equals: 7 },
          status: { in: ['PENDING', 'OVERDUE', 'ESCALATED'] },
        },
        sort: '-dueDate',
        depth: 2,
        limit: 0,
      })
    })
  })

  describe('getTrainingInfo', () => {
    it('should return the content of a known training', () => {
      const info = getTrainingInfo('training-risk')

      expect(info.title).toBe('Social Media Risk Mitigation Training')
      expect(info.topics.length).toBeGreaterThan(0)
    })

    it('should return placeholder content for an unknown training', () => {
      expect(getTrainingInfo('training-unknown')).toEqual({
        title: 'Required Training',
        topics: ['Training material to be defined'],
        objectives: ['Complete assigned training'],
      })
    })
  })

  describe('getTaskForUser', () => {
    it('should redirect to login when there is no signed in user', async () => {
      fakePayload.authUser = null

      await expect(getTaskForUser('42')).rejects.toThrow('NEXT_REDIRECT:/login')
    })

    it('should return not found when the task is not assigned to the user', async () => {
      await expect(getTaskForUser('42')).rejects.toThrow('NEXT_NOT_FOUND')
      expect(payload.find.mock.calls[0][0].where).toEqual({
        and: [{ id: { equals: 42 } }, { assignedUser: { equals: 7 } }],
      })
    })

    it('should return the task assigned to the user', async () => {
      const task = buildComplianceTask({ id: 42, assignedUser: 7 })
      payload.find.mockResolvedValue({ docs: [task], totalDocs: 1 })

      await expect(getTaskForUser('42')).resolves.toBe(task)
    })
  })

  describe('getTaskForUserWithAccounts', () => {
    it('should redirect to login when there is no signed in user', async () => {
      fakePayload.authUser = null

      await expect(getTaskForUserWithAccounts('42')).rejects.toThrow('NEXT_REDIRECT:/login')
    })

    it('should return not found when the task does not exist for the user', async () => {
      await expect(getTaskForUserWithAccounts('42')).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('should not load accounts for tasks other than roll call', async () => {
      const task = buildComplianceTask({ id: 42, type: 'CONFIRM_2FA' })
      payload.find.mockResolvedValue({ docs: [task], totalDocs: 1 })

      const result = await getTaskForUserWithAccounts('42')

      expect(result).toEqual({ task, assignedAccounts: [] })
      expect(payload.find).toHaveBeenCalledTimes(1)
    })

    it('should load the social media accounts the user manages for a roll call', async () => {
      const task = buildComplianceTask({ id: 42, type: 'USER_ROLL_CALL' })
      const accounts = [{ id: 1, name: 'Instagram Admisiones' }]
      payload.find
        .mockResolvedValueOnce({ docs: [task], totalDocs: 1 })
        .mockResolvedValueOnce({ docs: accounts, totalDocs: 1 })

      const result = await getTaskForUserWithAccounts('42')

      expect(result.assignedAccounts).toBe(accounts)
      expect(payload.find.mock.calls[1][0]).toMatchObject({
        collection: 'social-medias',
        sort: 'name',
        where: { and: [{ tenant: { equals: 10 } }, expect.anything()] },
      })
    })

    it('should resolve the tenant id when the user tenant is populated', async () => {
      fakePayload.authUser = { id: 7, tenant: { id: 12 } }
      const task = buildComplianceTask({ type: 'USER_ROLL_CALL' })
      payload.find.mockResolvedValue({ docs: [task], totalDocs: 1 })

      await getTaskForUserWithAccounts('42')

      expect(payload.find.mock.calls[1][0].where.and[0]).toEqual({ tenant: { equals: 12 } })
    })

    it('should skip the accounts lookup when the user has no tenant', async () => {
      fakePayload.authUser = { id: 7, tenant: null }
      const task = buildComplianceTask({ type: 'USER_ROLL_CALL' })
      payload.find.mockResolvedValue({ docs: [task], totalDocs: 1 })

      const result = await getTaskForUserWithAccounts('42')

      expect(result.assignedAccounts).toEqual([])
      expect(payload.find).toHaveBeenCalledTimes(1)
    })

    it('should return an empty account list when the lookup fails', async () => {
      const task = buildComplianceTask({ type: 'USER_ROLL_CALL' })
      payload.find
        .mockResolvedValueOnce({ docs: [task], totalDocs: 1 })
        .mockRejectedValueOnce(new Error('db down'))

      const result = await getTaskForUserWithAccounts('42')

      expect(result).toEqual({ task, assignedAccounts: [] })
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('getTaskForUserWithFlag', () => {
    it('should redirect to login when there is no signed in user', async () => {
      fakePayload.authUser = null

      await expect(getTaskForUserWithFlag('42')).rejects.toThrow('NEXT_REDIRECT:/login')
    })

    it('should return not found when the task is missing', async () => {
      await expect(getTaskForUserWithFlag('42')).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('should return not found when the task has no related flag', async () => {
      payload.find.mockResolvedValue({
        docs: [buildComplianceTask({ type: 'REVIEW_FLAG', relatedFlag: null })],
        totalDocs: 1,
      })

      await expect(getTaskForUserWithFlag('42')).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('should return not found when the flag no longer exists', async () => {
      payload.find.mockResolvedValue({
        docs: [buildComplianceTask({ type: 'REVIEW_FLAG', relatedFlag: 300 })],
        totalDocs: 1,
      })
      payload.findByID.mockResolvedValue(null)

      await expect(getTaskForUserWithFlag('42')).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('should return the task together with its flag', async () => {
      const task = buildComplianceTask({ type: 'REVIEW_FLAG', relatedFlag: 300 })
      const flag = { id: 300, status: 'pending' }
      payload.find.mockResolvedValue({ docs: [task], totalDocs: 1 })
      payload.findByID.mockResolvedValue(flag)

      await expect(getTaskForUserWithFlag('42')).resolves.toEqual({ task, flag })
      expect(payload.findByID).toHaveBeenCalledWith({ collection: 'flags', id: 300, depth: 2 })
    })

    it('should resolve the flag id from a populated relation', async () => {
      const task = buildComplianceTask({
        type: 'REVIEW_FLAG',
        relatedFlag: { id: 301, status: 'pending', createdAt: '', updatedAt: '' },
      })
      payload.find.mockResolvedValue({ docs: [task], totalDocs: 1 })
      payload.findByID.mockResolvedValue({ id: 301 })

      await getTaskForUserWithFlag('42')

      expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ id: 301 }))
    })
  })

  describe('getComplianceTasksByUserIds', () => {
    it('should return an empty map without querying when there are no user ids', async () => {
      const result = await getComplianceTasksByUserIds([])

      expect(result.size).toBe(0)
      expect(payload.find).not.toHaveBeenCalled()
    })

    it('should group tasks by assigned user, handling populated users', async () => {
      payload.find.mockResolvedValue({
        docs: [
          buildComplianceTask({ id: 1, assignedUser: 7 }),
          buildComplianceTask({ id: 2, assignedUser: buildUser({ id: 7 }) }),
          buildComplianceTask({ id: 3, assignedUser: 8 }),
        ],
        totalDocs: 3,
      })

      const result = await getComplianceTasksByUserIds([7, 8])

      expect(result.get(7)?.map((t) => t.id)).toEqual([1, 2])
      expect(result.get(8)?.map((t) => t.id)).toEqual([3])
    })
  })
})
