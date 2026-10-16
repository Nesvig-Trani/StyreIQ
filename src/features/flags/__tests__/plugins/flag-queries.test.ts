import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import {
  buildComplianceTask,
  buildFlag,
  buildOrganization,
  buildUser,
} from '@/shared/__tests__/fixtures'
import type { User } from '@/types/payload-types'
import { FlagStatusEnum } from '../../schemas'

const context = vi.hoisted(() => ({
  payload: null as ReturnType<typeof createFakePayload> | null,
  selectedTenant: undefined as string | undefined,
}))

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: () => (context.selectedTenant ? { value: context.selectedTenant } : undefined),
  }),
}))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: context.payload?.asPayload() }),
}))

import { getFlagInfoForDashboard, getFlags } from '../../plugins/queries'

const baseFilters = {
  lastActivityFrom: '',
  lastActivityTo: '',
  detectionDateFrom: '',
  detectionDateTo: '',
  pageSize: 10,
  pageIndex: 0,
}

const setup = (user: User | null, selectedTenant?: string) => {
  const payload = createFakePayload()
  const auth = vi.fn().mockResolvedValue({ user })
  context.payload = Object.assign(payload, { auth })
  context.selectedTenant = selectedTenant
  return payload
}

const lastFindWhere = (payload: ReturnType<typeof createFakePayload>, collection: string) =>
  payload.find.mock.calls.filter(([arg]) => arg.collection === collection).at(-1)?.[0].where

describe('getFlags', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('should return an empty page when nobody is signed in', async () => {
    const payload = setup(null)

    const result = await getFlags(baseFilters)

    expect(result).toMatchObject({ docs: [], totalDocs: 0, totalPages: 0, page: 1 })
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should scope a central admin to their own tenant and paginate on the server', async () => {
    const payload = setup(buildUser({ roles: ['central_admin'], tenant: 10 }))

    await getFlags({ ...baseFilters, pageSize: 25, pageIndex: 2 })

    expect(payload.find).toHaveBeenCalledWith({
      collection: 'flags',
      limit: 25,
      page: 3,
      where: { tenant: { equals: 10 } },
      depth: 1,
      overrideAccess: true,
    })
  })

  it('should build filters from type, status, organizations and date ranges', async () => {
    const payload = setup(buildUser({ roles: ['central_admin'], tenant: 10 }))

    await getFlags({
      ...baseFilters,
      flagType: ['missing_2fa'],
      status: [FlagStatusEnum.PENDING],
      organizations: [100],
      lastActivityFrom: new Date(2026, 8, 1, 12).toISOString(),
      lastActivityTo: new Date(2026, 8, 30, 12).toISOString(),
      detectionDateFrom: new Date(2026, 7, 1, 12).toISOString(),
    })

    const where = lastFindWhere(payload, 'flags')
    expect(where.flagType).toEqual({ in: ['missing_2fa'] })
    expect(where.status).toEqual({ in: ['pending'] })
    expect(where.organizations).toEqual({ in: [100] })
    expect(where.lastActivity.greater_than_equal).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0))
    expect(where.lastActivity.less_than_equal).toEqual(new Date(2026, 8, 30, 23, 59, 59, 999))
    expect(where.detectionDate.greater_than_equal).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0))
    expect(where.detectionDate.less_than_equal).toBeUndefined()
  })

  it('should not scope a super admin to a tenant when none is selected', async () => {
    const payload = setup(buildUser({ roles: ['super_admin'], tenant: null }))

    await getFlags(baseFilters)

    expect(lastFindWhere(payload, 'flags')).toEqual({})
  })

  it('should scope a super admin to the tenant selected in the cookie', async () => {
    const payload = setup(buildUser({ roles: ['super_admin'], tenant: null }), '12')

    await getFlags(baseFilters)

    expect(lastFindWhere(payload, 'flags')).toEqual({ tenant: { equals: 12 } })
  })

  it('should let an explicit tenant filter override the default tenant scope', async () => {
    const payload = setup(buildUser({ roles: ['super_admin'], tenant: null }), '12')

    await getFlags({ ...baseFilters, tenant: [10, 11] })

    expect(lastFindWhere(payload, 'flags')).toEqual({ tenant: { in: [10, 11] } })
  })

  it('should limit a unit admin to flags in their units or created by them', async () => {
    const unitAdmin = buildUser({
      id: 8,
      roles: ['unit_admin'],
      tenant: 10,
      organizations: [buildOrganization({ id: 100 })],
    })
    const payload = setup(unitAdmin)
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 }) // child units
      .mockResolvedValueOnce({ docs: [buildOrganization({ id: 100 })], totalDocs: 1 })

    await getFlags(baseFilters)

    expect(lastFindWhere(payload, 'flags').and).toEqual([
      { or: [{ organizations: { in: [100] } }, { createdBy: { equals: 8 } }] },
    ])
  })

  it('should limit a unit admin without accessible units to the flags they created', async () => {
    const payload = setup(
      buildUser({ id: 8, roles: ['unit_admin'], tenant: 10, organizations: [] }),
    )

    await getFlags(baseFilters)

    expect(lastFindWhere(payload, 'flags').and).toEqual([{ createdBy: { equals: 8 } }])
  })

  it('should return an empty page for roles without any flag visibility', async () => {
    const payload = setup(buildUser({ roles: [], tenant: 10 }))

    const result = await getFlags(baseFilters)

    expect(result).toMatchObject({ docs: [], totalDocs: 0, limit: 0 })
    expect(payload.find).not.toHaveBeenCalled()
  })

  describe('as a social media manager', () => {
    const manager = buildUser({ id: 5, roles: ['social_media_manager'], tenant: 10 })

    const arrange = (flags: ReturnType<typeof buildFlag>[]) => {
      const payload = setup(manager)
      payload.find.mockImplementation(async ({ collection }) =>
        collection === 'social-medias'
          ? { docs: [{ id: 31, organization: 100 }], totalDocs: 1 }
          : { docs: flags, totalDocs: flags.length },
      )
      return payload
    }

    it('should keep flags created by the manager', async () => {
      arrange([buildFlag({ id: 1, createdBy: 5 })])

      const result = await getFlags(baseFilters)

      expect(result).toMatchObject({ totalDocs: 1, docs: [{ id: 1 }] })
    })

    it('should drop flags from organizations the manager does not work with', async () => {
      arrange([buildFlag({ id: 2, organizations: [999], createdBy: 77 })])

      const result = await getFlags(baseFilters)

      expect(result).toMatchObject({ totalDocs: 0, docs: [] })
    })

    it('should keep organization flags with no specific affected entity', async () => {
      arrange([buildFlag({ id: 3, organizations: [100], createdBy: 77 })])

      const result = await getFlags(baseFilters)

      expect(result.docs).toHaveLength(1)
    })

    it('should only keep social media flags for accounts the manager manages', async () => {
      arrange([
        buildFlag({
          id: 4,
          organizations: [buildOrganization({ id: 100 })],
          affectedEntity: { relationTo: 'social-medias', value: 31 },
        }),
        buildFlag({
          id: 5,
          organizations: [100],
          affectedEntity: { relationTo: 'social-medias', value: 32 },
        }),
      ])

      const result = await getFlags(baseFilters)

      expect(result.docs.map((flag) => flag.id)).toEqual([4])
    })

    it('should only keep user flags that concern the manager themselves', async () => {
      arrange([
        buildFlag({
          id: 6,
          organizations: [100],
          affectedEntity: { relationTo: 'users', value: 5 },
        }),
        buildFlag({
          id: 7,
          organizations: [100],
          affectedEntity: { relationTo: 'users', value: 6 },
        }),
        buildFlag({
          id: 8,
          organizations: [100],
          affectedEntity: { relationTo: 'organization', value: 100 },
        }),
      ])

      const result = await getFlags(baseFilters)

      expect(result.docs.map((flag) => flag.id)).toEqual([6, 8])
    })

    it('should paginate the filtered flags in memory', async () => {
      arrange([1, 2, 3, 4, 5].map((id) => buildFlag({ id, createdBy: 5 })))

      const result = await getFlags({ ...baseFilters, pageSize: 2, pageIndex: 1 })

      expect(result).toMatchObject({
        docs: [{ id: 3 }, { id: 4 }],
        totalDocs: 5,
        totalPages: 3,
        page: 2,
        hasNextPage: true,
        hasPrevPage: true,
        prevPage: 1,
        nextPage: 3,
        pagingCounter: 3,
      })
    })

    it('should report no further pages on the last page', async () => {
      arrange([buildFlag({ id: 1, createdBy: 5 }), buildFlag({ id: 2, createdBy: 5 })])

      const result = await getFlags({ ...baseFilters, pageSize: 2, pageIndex: 0 })

      expect(result).toMatchObject({ hasNextPage: false, nextPage: null, prevPage: null })
    })
  })
})

describe('getFlagInfoForDashboard', () => {
  it('should return empty categories when nobody is signed in', async () => {
    setup(null)

    const result = await getFlagInfoForDashboard()

    expect(result).toEqual({
      accessManagement: { count: 0, data: [] },
      security: { count: 0, data: [] },
      policiesTraining: { count: 0, data: [] },
      flaggedIssues: { count: 0, data: [] },
    })
  })

  it('should group pending compliance tasks by category and count open flags', async () => {
    const payload = setup(buildUser({ roles: ['central_admin'], tenant: 10 }))
    const tasks = [
      buildComplianceTask({ id: 1, type: 'USER_ROLL_CALL' }),
      buildComplianceTask({ id: 2, type: 'CONFIRM_2FA' }),
      buildComplianceTask({ id: 3, type: 'CONFIRM_USER_PASSWORD' }),
      buildComplianceTask({ id: 4, type: 'CONFIRM_SHARED_PASSWORD' }),
      buildComplianceTask({ id: 5, type: 'POLICY_ACKNOWLEDGMENT' }),
      buildComplianceTask({ id: 6, type: 'TRAINING_COMPLETION' }),
    ]
    payload.find.mockImplementation(async ({ collection }) =>
      collection === 'compliance_tasks'
        ? { docs: tasks, totalDocs: tasks.length }
        : { docs: [buildFlag({ id: 9 })], totalDocs: 1 },
    )

    const result = await getFlagInfoForDashboard()

    expect(result.accessManagement.count).toBe(1)
    expect(result.security.count).toBe(3)
    expect(result.policiesTraining.count).toBe(2)
    expect(result.flaggedIssues).toMatchObject({ count: 1, data: [{ id: 9 }] })
    expect(lastFindWhere(payload, 'compliance_tasks')).toEqual({
      and: [{ status: { in: ['PENDING', 'OVERDUE'] } }, { tenant: { equals: 10 } }],
    })
  })

  it('should only count tasks assigned to a social media manager and flags on their accounts', async () => {
    const payload = setup(buildUser({ id: 5, roles: ['social_media_manager'], tenant: 10 }))
    payload.find.mockImplementation(async ({ collection }) =>
      collection === 'social-medias'
        ? { docs: [{ id: 31 }, { id: 32 }], totalDocs: 2 }
        : { docs: [], totalDocs: 0 },
    )

    await getFlagInfoForDashboard()

    expect(lastFindWhere(payload, 'compliance_tasks').and[1]).toEqual({
      assignedUser: { equals: 5 },
    })
    expect(lastFindWhere(payload, 'flags').and[1].or).toEqual([
      {
        'affectedEntity.relationTo': { equals: 'social-medias' },
        'affectedEntity.value': { in: [31, 32] },
      },
      {
        'affectedEntity.relationTo': { equals: 'users' },
        'affectedEntity.value': { equals: 5 },
      },
    ])
  })

  it('should scope a unit admin to tasks of the users in their units', async () => {
    const unitAdmin = buildUser({
      id: 8,
      roles: ['unit_admin'],
      tenant: 10,
      organizations: [buildOrganization({ id: 100 })],
    })
    const payload = setup(unitAdmin)
    payload.find.mockImplementation(async ({ collection }) => {
      if (collection === 'users') return { docs: [{ id: 41 }, { id: 42 }], totalDocs: 2 }
      if (collection === 'organization') {
        return { docs: [], totalDocs: 0 }
      }
      return { docs: [], totalDocs: 0 }
    })

    await getFlagInfoForDashboard()

    expect(lastFindWhere(payload, 'compliance_tasks').and[1]).toEqual({
      assignedUser: { in: [41, 42] },
    })
    expect(lastFindWhere(payload, 'flags').and[1]).toEqual({
      'organizations.id': { in: [100] },
    })
  })

  it('should scope a super admin to the selected tenant', async () => {
    const payload = setup(buildUser({ roles: ['super_admin'], tenant: null }), '12')

    await getFlagInfoForDashboard()

    expect(lastFindWhere(payload, 'compliance_tasks').and[1]).toEqual({ tenant: { equals: 12 } })
    expect(lastFindWhere(payload, 'flags').and[1]).toEqual({ tenant: { equals: 12 } })
  })

  it('should not scope a super admin when no tenant is selected', async () => {
    const payload = setup(buildUser({ roles: ['super_admin'], tenant: null }))

    await getFlagInfoForDashboard()

    expect(lastFindWhere(payload, 'compliance_tasks')).toEqual({
      status: { in: ['PENDING', 'OVERDUE'] },
    })
    expect(lastFindWhere(payload, 'flags').and).toHaveLength(2)
  })

  it('should match no flags when the user has no role', async () => {
    const payload = setup(buildUser({ roles: [], tenant: 10 }))

    await getFlagInfoForDashboard()

    expect(lastFindWhere(payload, 'flags')).toEqual({ id: { equals: -1 } })
  })
})
