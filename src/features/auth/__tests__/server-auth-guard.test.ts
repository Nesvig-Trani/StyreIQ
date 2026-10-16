import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serverAuthGuard } from '../hooks/serverAuthGuard'
import { buildUser } from '@/shared/__tests__/fixtures'
import {
  buildOrganizationAccess,
  createAuthPayload,
  pageOf,
  redirectError,
} from './auth-boundaries'

const payload = createAuthPayload()
const headerStore = vi.hoisted(() => ({ current: new Headers() }))

vi.mock('next/headers', () => ({ headers: async () => headerStore.current }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: payload.asPayload() }),
}))

/** Routes payload.find per collection: users total, and the user's unit access. */
const givenDatabase = ({ totalUsers, access }: { totalUsers: number; access: boolean }) => {
  payload.find.mockImplementation(async ({ collection }: { collection: string }) => ({
    ...pageOf(access && collection === 'organization_access' ? [buildOrganizationAccess()] : []),
    totalDocs: collection === 'users' ? totalUsers : 0,
  }))
}

beforeEach(() => {
  payload.auth.mockReset()
  payload.find.mockReset()
  headerStore.current = new Headers()
})

describe('serverAuthGuard', () => {
  it('should let an active user with unit access through', async () => {
    payload.auth.mockResolvedValue({ user: buildUser() })
    givenDatabase({ totalUsers: 5, access: true })
    await expect(serverAuthGuard()).resolves.toBeUndefined()
  })

  it('should log out an inactive user with the inactive reason', async () => {
    payload.auth.mockResolvedValue({ user: buildUser({ status: 'inactive' }) })
    givenDatabase({ totalUsers: 5, access: true })
    await expect(serverAuthGuard()).rejects.toThrow(redirectError('/api/logout?reason=inactive'))
  })

  it('should log out an active user with no unit access with the no-unit-access reason', async () => {
    payload.auth.mockResolvedValue({ user: buildUser() })
    givenDatabase({ totalUsers: 5, access: false })
    await expect(serverAuthGuard()).rejects.toThrow(
      redirectError('/api/logout?reason=no-unit-access'),
    )
  })

  it('should clear a stale session cookie when the token no longer resolves to a user', async () => {
    payload.auth.mockResolvedValue({ user: null })
    headerStore.current = new Headers({ cookie: 'payload-token=expired' })
    await expect(serverAuthGuard()).rejects.toThrow(redirectError('/api/logout'))
  })

  it('should send a visitor to the first-user setup when the platform has no users', async () => {
    payload.auth.mockResolvedValue({ user: null })
    givenDatabase({ totalUsers: 0, access: false })
    await expect(serverAuthGuard()).rejects.toThrow(redirectError('/login/create-first-user'))
  })

  it('should send an anonymous visitor to the login page when users exist', async () => {
    payload.auth.mockResolvedValue({ user: null })
    givenDatabase({ totalUsers: 12, access: false })
    await expect(serverAuthGuard()).rejects.toThrow(redirectError('/login'))
  })
})
