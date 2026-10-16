import { getAuditLogs, getSocialMediaAuditLogs } from '../../plugins/queries'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildUser } from '@/shared/__tests__/fixtures'
import { UserRolesEnum } from '@/features/users'

const boundary = vi.hoisted(() => ({
  payload: undefined as
    | undefined
    | ReturnType<typeof import('@/shared/__tests__/payload-fakes').createFakePayload>,
  user: null as null | ReturnType<typeof import('@/shared/__tests__/fixtures').buildUser>,
  cookies: new Map<string, string>(),
}))

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: boundary.payload }),
}))
vi.mock('@/features/auth/utils/getAuthUser', () => ({
  getAuthUser: async () => ({ user: boundary.user }),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = boundary.cookies.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))

beforeEach(() => {
  boundary.payload = createFakePayload()
  boundary.user = null
  boundary.cookies = new Map()
})

const asRole = (role: UserRolesEnum, overrides = {}) => {
  boundary.user = buildUser({ id: 31, roles: [role], tenant: 10, ...overrides })
}

const entries = [
  { id: 1, entity: 'users', document: { relationTo: 'users', value: { id: 31 } } },
  { id: 2, entity: 'organization', document: { relationTo: 'organization', value: { id: 100 } } },
  { id: 3, entity: 'social-medias', document: { relationTo: 'social-medias', value: { id: 8 } } },
  { id: 4, entity: 'users', document: { relationTo: 'users', value: 31 } },
  { id: 5, entity: 'users', document: { relationTo: 'users', value: { id: 31 } } },
]

const baseParams = {
  entity: [],
  action: [],
  userId: 0,
  from: '',
  to: '',
  pageSize: 10,
  pageIndex: 0,
}

describe('getAuditLogs', () => {
  it('should return an empty page when nobody is signed in', async () => {
    const result = await getAuditLogs(baseParams)
    expect(result.docs).toEqual([])
    expect(result.totalDocs).toBe(0)
    expect(boundary.payload?.find).not.toHaveBeenCalled()
  })

  it('should query without filters for a SuperAdmin with no tenant selected, bypassing access rules', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    await getAuditLogs(baseParams)
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit_log',
        where: {},
        overrideAccess: true,
        page: 1,
        limit: 0,
      }),
    )
  })

  it('should scope a SuperAdmin to the tenant selected in the cookie', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    boundary.cookies.set('styreiq_selected_tenant', '12')
    await getAuditLogs(baseParams)
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenant: { equals: 12 } } }),
    )
  })

  it('should let an explicit tenant filter override the selected tenant', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    boundary.cookies.set('styreiq_selected_tenant', '12')
    await getAuditLogs({ ...baseParams, tenant: [10, 11] })
    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenant: { in: [10, 11] } } }),
    )
  })

  it('should translate entity, action, user and date range filters into a where clause', async () => {
    asRole(UserRolesEnum.CentralAdmin)
    await getAuditLogs({
      ...baseParams,
      entity: ['users'],
      action: ['create', 'update'],
      userId: 31,
      from: '2026-09-01T12:00:00',
      to: '2026-09-30T12:00:00',
    })

    const { where, overrideAccess } = boundary.payload?.find.mock.calls[0][0]
    expect(overrideAccess).toBe(false)
    expect(where.entity).toEqual({ in: ['users'] })
    expect(where.action).toEqual({ in: ['create', 'update'] })
    expect(where.user).toEqual({ equals: 31 })
    expect(where.createdAt.greater_than_equal).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0))
    expect(where.createdAt.less_than_equal).toEqual(new Date(2026, 8, 30, 23, 59, 59, 999))
  })

  it('should paginate the matching logs in memory', async () => {
    asRole(UserRolesEnum.CentralAdmin)
    boundary.payload?.find.mockResolvedValue({ docs: entries, totalDocs: 5 })

    const result = await getAuditLogs({ ...baseParams, pageSize: 2, pageIndex: 1 })

    expect(result.docs.map((d) => d.id)).toEqual([3, 4])
    expect(result.totalDocs).toBe(5)
    expect(result.totalPages).toBe(3)
  })

  it('should keep only the history of one user when userDocumentId is given', async () => {
    asRole(UserRolesEnum.CentralAdmin)
    boundary.payload?.find.mockResolvedValue({ docs: entries })

    const result = await getAuditLogs({ ...baseParams, userDocumentId: 31 })

    expect(result.docs.map((d) => d.id)).toEqual([1, 5])
    expect(result.totalDocs).toBe(2)
  })

  it('should keep only the history of one organization when organizationDocumentId is given', async () => {
    asRole(UserRolesEnum.CentralAdmin)
    boundary.payload?.find.mockResolvedValue({ docs: entries })

    const result = await getAuditLogs({ ...baseParams, organizationDocumentId: 100 })

    expect(result.docs.map((d) => d.id)).toEqual([2])
  })

  it('should keep only the history of one social media account when socialMediaDocumentId is given', async () => {
    asRole(UserRolesEnum.CentralAdmin)
    boundary.payload?.find.mockResolvedValue({ docs: entries })

    const result = await getAuditLogs({ ...baseParams, socialMediaDocumentId: 8 })

    expect(result.docs.map((d) => d.id)).toEqual([3])
  })
})

describe('getSocialMediaAuditLogs', () => {
  it('should return no logs when nobody is signed in', async () => {
    expect(await getSocialMediaAuditLogs({ socialMediaId: 8 })).toEqual({ docs: [] })
  })

  it('should match logs whose current or previous snapshot is the account', async () => {
    asRole(UserRolesEnum.UnitAdmin)
    await getSocialMediaAuditLogs({ socialMediaId: 8, action: ['update'], userId: 31 })

    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit_log',
        overrideAccess: false,
        where: {
          entity: { equals: 'social-medias' },
          action: { in: ['update'] },
          user: { equals: 31 },
          or: [{ 'current.id': { equals: 8 } }, { 'prev.id': { equals: 8 } }],
        },
      }),
    )
  })

  it('should add the selected tenant for a SuperAdmin and bypass access rules', async () => {
    asRole(UserRolesEnum.SuperAdmin)
    boundary.cookies.set('styreiq_selected_tenant', '12')
    await getSocialMediaAuditLogs({ socialMediaId: 8 })

    expect(boundary.payload?.find).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: true,
        where: expect.objectContaining({ tenant: { equals: 12 } }),
      }),
    )
  })
})
