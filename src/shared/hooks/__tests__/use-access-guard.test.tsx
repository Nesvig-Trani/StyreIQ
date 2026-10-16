import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  checkAccessGuard,
  checkUserCreateAccess,
  checkUserDeleteAccess,
  checkUserReadAccess,
  checkUserUpdateAccess,
} from '../use-access-guard'
import { buildOrganization, buildUser } from '../../__tests__/fixtures'

const getAuthUser = vi.hoisted(() => vi.fn())
vi.mock('@/features/auth/utils/getAuthUser', () => ({ getAuthUser }))

beforeEach(() => vi.clearAllMocks())

describe('checkAccessGuard', () => {
  it('should deny anonymous visitors with a login message', async () => {
    getAuthUser.mockResolvedValue({ user: null })

    const result = await checkAccessGuard({ action: 'read', resource: 'DASHBOARD' })

    expect(result.accessDenied).toBe(true)
    expect(result.user).toBeNull()
    render(<>{result.component}</>)
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You must be logged in to access this page.')).toBeInTheDocument()
  })

  it('should allow a user whose role grants the permission', async () => {
    const admin = buildUser({ roles: ['super_admin'] })
    getAuthUser.mockResolvedValue({ user: admin })

    const result = await checkAccessGuard({ action: 'read', resource: 'TENANTS' })

    expect(result).toEqual({ user: admin, accessDenied: false, component: null })
  })

  it('should deny a user lacking the permission and use the custom copy', async () => {
    const manager = buildUser({
      roles: ['social_media_manager'],
      organizations: [buildOrganization()],
    })
    getAuthUser.mockResolvedValue({ user: manager })

    const result = await checkAccessGuard({
      action: 'delete',
      resource: 'USERS',
      title: 'Sin permiso',
      message: 'Contacta a la Dirección de Comunicaciones.',
    })

    expect(result.accessDenied).toBe(true)
    render(<>{result.component}</>)
    expect(screen.getByText('Sin permiso')).toBeInTheDocument()
    expect(screen.getByText('Contacta a la Dirección de Comunicaciones.')).toBeInTheDocument()
  })
})

describe('user management guards', () => {
  it('should deny social media managers creating or deleting users with a tailored message', async () => {
    const manager = buildUser({
      roles: ['social_media_manager'],
      organizations: [buildOrganization()],
    })
    getAuthUser.mockResolvedValue({ user: manager })

    const created = await checkUserCreateAccess()
    expect(created.accessDenied).toBe(true)
    const { unmount } = render(<>{created.component}</>)
    expect(screen.getByText(/permission to create new users/)).toBeInTheDocument()
    unmount()

    const deleted = await checkUserDeleteAccess()
    expect(deleted.accessDenied).toBe(true)
    render(<>{deleted.component}</>)
    expect(screen.getByText(/permission to delete users/)).toBeInTheDocument()
  })

  it('should follow the role matrix for reading and updating users', async () => {
    const manager = buildUser({
      roles: ['social_media_manager'],
      organizations: [buildOrganization()],
    })
    getAuthUser.mockResolvedValue({ user: manager })
    expect((await checkUserReadAccess()).accessDenied).toBe(false)
    expect((await checkUserUpdateAccess()).accessDenied).toBe(false)
  })

  it('should let a super admin through every user guard', async () => {
    getAuthUser.mockResolvedValue({ user: buildUser({ roles: ['super_admin'] }) })
    expect((await checkUserReadAccess()).accessDenied).toBe(false)
    expect((await checkUserDeleteAccess()).accessDenied).toBe(false)
  })
})
