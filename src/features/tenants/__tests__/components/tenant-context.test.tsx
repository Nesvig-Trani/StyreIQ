import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  TenantProvider,
  useTenant,
  useTenantIdForFilter,
} from '@/features/tenants/contexts/tenant-context'
import { buildUser } from '@/shared/__tests__/fixtures'
import { buildTenant } from '../tenant-fixtures'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const andina = buildTenant({ id: 10, name: 'Universidad Andina' })
const sanMartin = buildTenant({ id: 11, name: 'Colegio San Martín', domain: 'sanmartin.edu.co' })
const superAdmin = buildUser({ roles: ['super_admin'], tenant: null })
const centralAdmin = buildUser({ roles: ['central_admin'], tenant: 10 })

const wrapperFor = (user: ReturnType<typeof buildUser>, selected: typeof andina | null = null) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TenantProvider
      user={user}
      initialSelectedTenant={selected}
      initialAvailableTenants={[andina, sanMartin]}
    >
      {children}
    </TenantProvider>
  )
  return Wrapper
}

beforeEach(() => {
  fetchMock.mockReset()
  refresh.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('useTenant', () => {
  it('should throw when used outside of a TenantProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useTenant())).toThrow(/must be used within a TenantProvider/)
  })

  it('should let super admins switch tenants and treat no selection as viewing all', () => {
    const { result } = renderHook(() => useTenant(), { wrapper: wrapperFor(superAdmin) })
    expect(result.current.canSwitchTenants).toBe(true)
    expect(result.current.isViewingAllTenants).toBe(true)
    expect(result.current.tenantIdForFilter).toBeNull()
    expect(result.current.availableTenants).toHaveLength(2)
  })

  it('should not let other roles switch tenants', () => {
    const { result } = renderHook(() => useTenant(), {
      wrapper: wrapperFor(centralAdmin, andina),
    })
    expect(result.current.canSwitchTenants).toBe(false)
    expect(result.current.isViewingAllTenants).toBe(false)
    expect(result.current.tenantIdForFilter).toBe(10)
  })

  it('should expose the selected tenant id through useTenantIdForFilter', () => {
    const { result } = renderHook(() => useTenantIdForFilter(), {
      wrapper: wrapperFor(superAdmin, sanMartin),
    })
    expect(result.current).toBe(11)
  })
})

describe('selectTenant', () => {
  it('should persist the selection, update the state and refresh the page', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }))
    const { result } = renderHook(() => useTenant(), { wrapper: wrapperFor(superAdmin) })
    await act(() => result.current.selectTenant(11))
    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.styreiq.test/api/tenants/select-tenant',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ tenantId: 11 }) }),
    )
    expect(result.current.selectedTenant?.id).toBe(11)
    expect(result.current.isViewingAllTenants).toBe(false)
    expect(result.current.error).toBeNull()
    expect(refresh).toHaveBeenCalled()
  })

  it('should clear the selection when switching to all tenants', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }))
    const { result } = renderHook(() => useTenant(), {
      wrapper: wrapperFor(superAdmin, andina),
    })
    await act(() => result.current.selectTenant(null))
    expect(result.current.selectedTenant).toBeNull()
    expect(result.current.isViewingAllTenants).toBe(true)
  })

  it('should expose the API error and keep the current tenant', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: 'Tenant with ID 99 not found' }))
    const { result } = renderHook(() => useTenant(), {
      wrapper: wrapperFor(superAdmin, andina),
    })
    await act(() => result.current.selectTenant(99))
    expect(result.current.error).toBe('Tenant with ID 99 not found')
    expect(result.current.selectedTenant?.id).toBe(10)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('should fail when the tenant is not in the available list', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }))
    const { result } = renderHook(() => useTenant(), { wrapper: wrapperFor(superAdmin) })
    await act(() => result.current.selectTenant(99))
    expect(result.current.error).toBe('Tenant not found in available tenants')
  })
})

describe('refetchTenants', () => {
  it('should reload the available tenants for super admins', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { tenants: [andina] }))
    const { result } = renderHook(() => useTenant(), { wrapper: wrapperFor(superAdmin) })
    await act(() => result.current.refetchTenants())
    await waitFor(() => expect(result.current.availableTenants).toEqual([andina]))
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/tenants/available')
  })

  it('should keep the current tenants when the request fails and clear them when no list returns', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new TypeError('offline'))
    const { result } = renderHook(() => useTenant(), { wrapper: wrapperFor(superAdmin) })
    await act(() => result.current.refetchTenants())
    expect(result.current.availableTenants).toHaveLength(2)

    fetchMock.mockResolvedValueOnce(jsonResponse(200, {}))
    await act(() => result.current.refetchTenants())
    expect(result.current.availableTenants).toEqual([])
  })

  it('should do nothing for roles that cannot switch tenants', async () => {
    const { result } = renderHook(() => useTenant(), { wrapper: wrapperFor(centralAdmin, andina) })
    await act(() => result.current.refetchTenants())
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
