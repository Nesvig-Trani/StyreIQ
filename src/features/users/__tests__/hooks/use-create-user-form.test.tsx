import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import { buildOrganization } from '@/shared/__tests__/fixtures'
import useCreateUserForm from '../../hooks/useCreateUserForm'
import { USER_ALREADY_EXISTS } from '../../constants/Errors'
import { UserRolesEnum, UserStatusEnum } from '../../schemas'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const raiz = buildOrganization({ id: 100, name: 'Universidad Andina', depth: 0 })
const comunicaciones = buildOrganization({
  id: 101,
  name: 'Dirección de Comunicaciones',
  depth: 1,
  path: '/100/101',
  parentOrg: raiz,
})
const organizations = [raiz, comunicaciones]

const setup = (authUserRole: UserRolesEnum = UserRolesEnum.CentralAdmin) =>
  renderHook(() =>
    useCreateUserForm({ initialOrganizations: organizations, authUserRole, topOrgDepth: 1 }),
  )

const fillValidUser = (result: ReturnType<typeof setup>['result']) =>
  act(() => {
    result.current.setValue('name', 'Laura Pineda')
    result.current.setValue('email', 'laura.pineda@universidad-andina.edu')
    result.current.setValue('organizations', ['101'])
  })

beforeEach(() => {
  push.mockReset()
  vi.mocked(toast).mockClear()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => vi.unstubAllGlobals())

describe('useCreateUserForm', () => {
  it('should default to the social media manager role and build the unit tree', () => {
    const { result } = setup()
    expect(result.current.selectedRoles).toEqual([UserRolesEnum.SocialMediaManager])
    expect(result.current.tree).toHaveLength(1)
    expect(result.current.tree[0].children).toHaveLength(1)
  })

  it('should limit assignable roles and statuses by the signed in role', () => {
    expect(setup(UserRolesEnum.CentralAdmin).result.current.allowedRoles).toEqual([
      UserRolesEnum.CentralAdmin,
      UserRolesEnum.UnitAdmin,
      UserRolesEnum.SocialMediaManager,
    ])
    const unitAdmin = setup(UserRolesEnum.UnitAdmin).result.current
    expect(unitAdmin.allowedStatuses).toEqual([])
    expect(setup().result.current.allowedStatuses).toEqual([
      UserStatusEnum.Active,
      UserStatusEnum.Inactive,
    ])
  })

  it('should only offer top level units when a unit admin picks the unit admin role', async () => {
    const { result } = setup(UserRolesEnum.UnitAdmin)
    await act(() => result.current.handleRolesChange([UserRolesEnum.UnitAdmin]))
    expect(result.current.organizations.map((org) => org.id)).toEqual([101])
    await act(() => result.current.handleRolesChange([UserRolesEnum.SocialMediaManager]))
    expect(result.current.organizations).toHaveLength(2)
  })

  it('should not call the API when validation fails', async () => {
    const { result } = setup()
    await act(() => result.current.handleSubmit())
    expect(result.current.errors.email?.message).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should report missing units as a form error', async () => {
    const { result } = setup()
    act(() => {
      result.current.setValue('name', 'Laura Pineda')
      result.current.setValue('email', 'laura.pineda@universidad-andina.edu')
    })
    await act(() => result.current.handleSubmit())
    expect(result.current.errors.organizations?.message).toBe(
      'Unit is required unless the user is Super Admin.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should create the user and open the access page', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 55, active_role: 'social_media_manager' }))
    const { result } = setup()
    fillValidUser(result)
    await act(() => result.current.handleSubmit())

    expect(push).toHaveBeenCalledWith('/dashboard/users/access/55')
    expect(toast.success).toHaveBeenCalledWith('User created successfully')
  })

  it('should return super admins to the users list after creation', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 56, active_role: 'super_admin' }))
    const { result } = setup(UserRolesEnum.SuperAdmin)
    fillValidUser(result)
    await act(() => result.current.handleSubmit())
    expect(push).toHaveBeenCalledWith('/dashboard/users')
  })

  it('should redirect to the existing user when the email is already registered', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: USER_ALREADY_EXISTS, details: 77 }))
    const { result } = setup()
    fillValidUser(result)
    await act(() => result.current.handleSubmit())

    expect(toast).toHaveBeenCalledWith('User already exists, update the user instead')
    expect(push).toHaveBeenCalledWith('/dashboard/users/update/77')
  })

  it('should show a generic error for other API failures', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: 'Error creating user' }))
    const { result } = setup()
    fillValidUser(result)
    await act(() => result.current.handleSubmit())
    expect(toast.error).toHaveBeenCalledWith(
      'An error occurred while creating the user, please try again',
    )
  })

  it('should show an unexpected error when the request cannot be made', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = setup()
    fillValidUser(result)
    await act(() => result.current.handleSubmit())
    expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred')
  })
})
