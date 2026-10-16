import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUser } from '@/shared/__tests__/fixtures'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { useAssignableUsers } from '../../hooks/useAssignableUsers'

const mocks = vi.hoisted(() => ({
  getUsersByOrganizationAndRole: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/features/users/plugins/queries', () => ({
  getUsersByOrganizationAndRole: mocks.getUsersByOrganizationAndRole,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: mocks.toastError } }))

const daniela = buildUser({ id: 1, name: 'Daniela Cárdenas', roles: ['unit_admin'] })
const laura = buildUser({ id: 3, name: 'Laura Vélez', roles: ['social_media_manager'] })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAssignableUsers', () => {
  it('should not query anything while no unit is selected', () => {
    const { result } = renderHook(() => useAssignableUsers(null))

    expect(result.current.users).toEqual([])
    expect(mocks.getUsersByOrganizationAndRole).not.toHaveBeenCalled()
  })

  it('should load admins and managers of the selected unit', async () => {
    mocks.getUsersByOrganizationAndRole.mockResolvedValue({ docs: [daniela, laura] })

    const { result } = renderHook(() => useAssignableUsers('100'))

    await waitFor(() => expect(result.current.users).toEqual([daniela, laura]))
    expect(mocks.getUsersByOrganizationAndRole).toHaveBeenCalledWith({
      organizationId: 100,
      roles: ['super_admin', 'unit_admin', 'social_media_manager'],
      statuses: ['active', 'pending_activation'],
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('should query the roles it is given instead of the default ones', async () => {
    mocks.getUsersByOrganizationAndRole.mockResolvedValue({ docs: [daniela] })

    renderHook(() =>
      useAssignableUsers('100', [UserRolesEnum.CentralAdmin, UserRolesEnum.UnitAdmin]),
    )

    await waitFor(() =>
      expect(mocks.getUsersByOrganizationAndRole).toHaveBeenCalledWith(
        expect.objectContaining({ roles: [UserRolesEnum.CentralAdmin, UserRolesEnum.UnitAdmin] }),
      ),
    )
  })

  it('should reload the users when the unit changes', async () => {
    mocks.getUsersByOrganizationAndRole
      .mockResolvedValueOnce({ docs: [daniela] })
      .mockResolvedValueOnce({ docs: [laura] })

    const { result, rerender } = renderHook(({ unit }) => useAssignableUsers(unit), {
      initialProps: { unit: '100' },
    })
    await waitFor(() => expect(result.current.users).toEqual([daniela]))

    rerender({ unit: '101' })

    await waitFor(() => expect(result.current.users).toEqual([laura]))
  })

  it('should ignore a stale response that arrives after the unit changed', async () => {
    let resolveFirst: (value: { docs: (typeof daniela)[] }) => void = () => undefined
    mocks.getUsersByOrganizationAndRole
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockResolvedValueOnce({ docs: [laura] })

    const { result, rerender } = renderHook(({ unit }) => useAssignableUsers(unit), {
      initialProps: { unit: '100' },
    })
    rerender({ unit: '101' })
    await waitFor(() => expect(result.current.users).toEqual([laura]))

    await act(async () => resolveFirst({ docs: [daniela] }))

    expect(result.current.users).toEqual([laura])
  })

  it('should tell the user when the users cannot be loaded', async () => {
    mocks.getUsersByOrganizationAndRole.mockRejectedValue(new Error('db unavailable'))

    const { result } = renderHook(() => useAssignableUsers('100'))

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Could not load the users of the selected unit, please try again',
      ),
    )
    expect(result.current.isLoading).toBe(false)
  })

  it('should refetch on demand', async () => {
    mocks.getUsersByOrganizationAndRole.mockResolvedValue({ docs: [daniela] })
    const { result } = renderHook(() => useAssignableUsers('100'))
    await waitFor(() => expect(result.current.users).toEqual([daniela]))

    await act(() => result.current.refreshUsers())

    expect(mocks.getUsersByOrganizationAndRole).toHaveBeenCalledTimes(2)
  })
})
