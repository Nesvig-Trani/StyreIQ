import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthUser, verifyUser } from '../utils/getAuthUser'
import { buildUser } from '@/shared/__tests__/fixtures'
import type { User } from '@/types/payload-types'
import { buildOrganizationAccess, createAuthPayload, pageOf } from './auth-boundaries'

const payload = createAuthPayload()
const requestHeaders = new Headers({ cookie: 'payload-token=abc123' })

vi.mock('next/headers', () => ({ headers: async () => requestHeaders }))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: payload.asPayload() }),
}))

/** `payload.auth` tags the user with its collection slug. */
const asAuthUser = (user: User) => ({ ...user, collection: 'users' as const })

beforeEach(() => {
  payload.auth.mockReset()
  payload.find.mockReset()
})

describe('getAuthUser', () => {
  it('should resolve the user from the request headers', async () => {
    const user = buildUser()
    payload.auth.mockResolvedValue({ user })
    const result = await getAuthUser()
    expect(payload.auth).toHaveBeenCalledWith({ headers: requestHeaders })
    expect(result).toEqual({ headers: requestHeaders, user })
  })

  it('should return a null user when the request is not authenticated', async () => {
    payload.auth.mockResolvedValue({ user: null })
    const result = await getAuthUser()
    expect(result.user).toBeNull()
    expect(result.headers).toBe(requestHeaders)
  })
})

describe('verifyUser', () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  it('should reject an unauthenticated request', async () => {
    payload.auth.mockResolvedValue({ user: null })
    await expect(verifyUser()).resolves.toBeNull()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should skip the auth lookup when the caller already loaded the user', async () => {
    const user = buildUser()
    payload.find.mockResolvedValue(pageOf([buildOrganizationAccess({ type: 'permanent' })]))
    await expect(verifyUser(asAuthUser(user))).resolves.toMatchObject(user)
    expect(payload.auth).not.toHaveBeenCalled()
  })

  it('should return null without hitting the database when the caller passes null', async () => {
    await expect(verifyUser(null)).resolves.toBeNull()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should accept an active user with permanent unit access', async () => {
    const user = buildUser()
    payload.auth.mockResolvedValue({ user })
    payload.find.mockResolvedValue(pageOf([buildOrganizationAccess({ type: 'permanent' })]))
    await expect(verifyUser()).resolves.toBe(user)
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'organization_access' }),
    )
  })

  it('should accept temporary access that has not expired yet', async () => {
    const user = buildUser()
    payload.find.mockResolvedValue(
      pageOf([buildOrganizationAccess({ type: 'temporary', end_date: tomorrow })]),
    )
    await expect(verifyUser(asAuthUser(user))).resolves.toMatchObject(user)
  })

  it('should reject a manager whose only temporary access has expired', async () => {
    payload.find.mockResolvedValue(
      pageOf([buildOrganizationAccess({ type: 'temporary', end_date: yesterday })]),
    )
    await expect(verifyUser(asAuthUser(buildUser()))).resolves.toBeNull()
  })

  it('should reject a manager without any unit access', async () => {
    payload.find.mockResolvedValue(pageOf([]))
    await expect(verifyUser(asAuthUser(buildUser()))).resolves.toBeNull()
  })

  it('should reject an inactive user even with valid access', async () => {
    payload.find.mockResolvedValue(pageOf([buildOrganizationAccess()]))
    await expect(verifyUser(asAuthUser(buildUser({ status: 'inactive' })))).resolves.toBeNull()
  })

  it('should let a super admin through without unit access', async () => {
    const superAdmin = buildUser({ roles: ['super_admin'] })
    payload.find.mockResolvedValue(pageOf([]))
    await expect(verifyUser(asAuthUser(superAdmin))).resolves.toMatchObject(superAdmin)
  })

  it('should let an inactive super admin through', async () => {
    const superAdmin = buildUser({ roles: ['super_admin'], status: 'inactive' })
    payload.find.mockResolvedValue(pageOf([buildOrganizationAccess()]))
    await expect(verifyUser(asAuthUser(superAdmin))).resolves.toMatchObject(superAdmin)
  })
})
