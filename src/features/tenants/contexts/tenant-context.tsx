'use client'

import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react'
import type { FC, ReactNode } from 'react'
import type { Tenant, User } from '@/types/payload-types'
import { UserRolesEnum } from '@/features/users'
import { useRouter } from 'next/navigation'
import { selectTenantRequest } from '@/sdk/tenants'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export interface TenantContextType {
  selectedTenant: Tenant | null
  availableTenants: Tenant[]
  isLoading: boolean
  selectTenant: (tenantId: number | null) => Promise<void>
  refetchTenants: () => Promise<void>
  canSwitchTenants: boolean
  error: string | null
  isViewingAllTenants: boolean
  tenantIdForFilter: number | null
}

const TenantContext = createContext<TenantContextType | null>(null)

interface TenantProviderProps {
  children: ReactNode
  user: User
  initialSelectedTenant?: Tenant | null
  initialAvailableTenants?: Tenant[]
}

export const TenantProvider: FC<TenantProviderProps> = ({
  children,
  user,
  initialSelectedTenant = null,
  initialAvailableTenants = [],
}) => {
  const router = useRouter()

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(initialSelectedTenant)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>(initialAvailableTenants)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const canSwitchTenants = isSuperAdmin
  const isViewingAllTenants = isSuperAdmin && selectedTenant === null
  const tenantIdForFilter = selectedTenant?.id ?? null

  useEffect(() => {
    setSelectedTenant(initialSelectedTenant)
    setAvailableTenants(initialAvailableTenants)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedTenant?.id, initialAvailableTenants.length])

  const refetchTenants = useCallback(async () => {
    if (!isSuperAdmin) return

    try {
      const response = await fetch('/api/tenants/available', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableTenants(data.tenants || [])
      }
    } catch (err) {
      console.error('Failed to refetch tenants:', err)
    }
  }, [isSuperAdmin])

  const selectTenant = useCallback(
    async (tenantId: number | null): Promise<void> => {
      try {
        setIsLoading(true)
        setError(null)

        await selectTenantRequest(tenantId)

        if (tenantId === null) {
          setSelectedTenant(null)
        } else {
          const tenant = availableTenants.find((t) => t.id === tenantId)
          if (tenant) {
            setSelectedTenant(tenant)
          } else {
            throw new Error('Tenant not found in available tenants')
          }
        }

        router.refresh()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to switch tenant'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [availableTenants, router],
  )

  const contextValue = useMemo<TenantContextType>(
    () => ({
      selectedTenant,
      availableTenants,
      isLoading,
      selectTenant,
      refetchTenants,
      canSwitchTenants,
      error,
      isViewingAllTenants,
      tenantIdForFilter,
    }),
    [
      selectedTenant,
      availableTenants,
      isLoading,
      selectTenant,
      refetchTenants,
      canSwitchTenants,
      error,
      isViewingAllTenants,
      tenantIdForFilter,
    ],
  )

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext)

  if (!context) {
    throw new Error(
      '[useTenant] Hook must be used within a TenantProvider. ' +
        'Make sure TenantProvider is wrapping your component tree.',
    )
  }

  return context
}

export function useTenantIdForFilter(): number | null {
  const { tenantIdForFilter } = useTenant()
  return tenantIdForFilter
}
