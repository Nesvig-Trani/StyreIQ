import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/types/payload-types'
import { buildUser } from '@/shared/__tests__/fixtures'

const getAuthUser = vi.hoisted(() => vi.fn<() => Promise<{ user: User | null }>>())
const getTotalUsers = vi.hoisted(() => vi.fn<() => Promise<number>>())

vi.mock('@/features/auth/utils/getAuthUser', () => ({ getAuthUser }))
vi.mock('../../plugins/queries', () => ({ getTotalUsers }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

import { serverAuthNoUsersGuard } from '../../hooks/serverAuthNoUsersGuard'

beforeEach(() => {
  getAuthUser.mockReset()
  getTotalUsers.mockReset()
})

describe('serverAuthNoUsersGuard', () => {
  it('should send signed in users to the dashboard', async () => {
    getAuthUser.mockResolvedValue({ user: buildUser() })
    await expect(serverAuthNoUsersGuard()).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })

  it('should send visitors to login once the first user exists', async () => {
    getAuthUser.mockResolvedValue({ user: null })
    getTotalUsers.mockResolvedValue(3)
    await expect(serverAuthNoUsersGuard()).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('should allow the first-user setup when the system has no users', async () => {
    getAuthUser.mockResolvedValue({ user: null })
    getTotalUsers.mockResolvedValue(0)
    await expect(serverAuthNoUsersGuard()).resolves.toBeUndefined()
  })
})
