import { cookies } from 'next/headers'
import type { Payload } from 'payload'
import type { Tenant, User } from '@/types/payload-types'
import { UserRolesEnum } from '@/features/users'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'

export interface ServerTenantContext {
  selectedTenant: Tenant | null
  tenantIdForFilter: number | null
  availableTenants: Tenant[]
  isViewingAllTenants: boolean
  userForQueries: User
}

export async function getServerTenantContext(
  user: User | null,
  payload: Payload,
): Promise<ServerTenantContext> {
  if (!user) {
    return {
      selectedTenant: null,
      tenantIdForFilter: null,
      availableTenants: [],
      isViewingAllTenants: false,
      userForQueries: null as unknown as User,
    }
  }

  const isSuperAdmin = user.role === UserRolesEnum.SuperAdmin

  if (!isSuperAdmin) {
    const tenantId = getTenantIdFromUser(user)
    let tenantData: Tenant | null = null

    if (tenantId != null) {
      tenantData = await payload.findByID({
        collection: 'tenants',
        id: tenantId,
      })
    }

    const userForQueries: User = {
      ...user,
      tenant: tenantId,
    }

    return {
      selectedTenant: tenantData,
      tenantIdForFilter: tenantId,
      availableTenants: tenantData ? [tenantData] : [],
      isViewingAllTenants: false,
      userForQueries,
    }
  }

  const tenantsResult = await payload.find({
    collection: 'tenants',
    where: {
      status: { equals: 'active' },
    },
    limit: 1,
    sort: 'name',
  })

  const availableTenants = tenantsResult.docs as Tenant[]

  const cookieStore = await cookies()
  const selectedTenantId = Number(cookieStore.get(SELECTED_TENANT_COOKIE_NAME)?.value)

  const selectedTenant = Number.isFinite(selectedTenantId)
    ? (availableTenants.find((t) => t.id === selectedTenantId) ?? null)
    : null

  if (!selectedTenant) {
    return {
      selectedTenant: null,
      tenantIdForFilter: null,
      availableTenants,
      isViewingAllTenants: true,
      userForQueries: user,
    }
  }

  const userForQueries: User = {
    ...user,
    tenant: selectedTenant.id,
  }

  return {
    selectedTenant,
    tenantIdForFilter: selectedTenant.id,
    availableTenants,
    isViewingAllTenants: false,
    userForQueries,
  }
}

export function getTenantIdFromUser(user: User | null): number | null {
  if (!user?.tenant) return null
  if (typeof user.tenant === 'number') return user.tenant
  if (typeof user.tenant === 'object' && 'id' in user.tenant) {
    return user.tenant.id
  }
  return null
}

export async function getSelectedTenantIdFromCookie(): Promise<number | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SELECTED_TENANT_COOKIE_NAME)

  if (!cookie?.value) return null

  const tenantId = Number(cookie.value)
  return Number.isFinite(tenantId) ? tenantId : null
}

export async function createUserForQueriesFromCookie(user: User): Promise<User> {
  if (user.role !== UserRolesEnum.SuperAdmin) {
    const tenantId = getTenantIdFromUser(user)
    return {
      ...user,
      tenant: tenantId,
    }
  }

  const selectedTenantId = await getSelectedTenantIdFromCookie()

  // If no tenant is selected, queries will run without tenant scoping (SuperAdmin mode)
  if (selectedTenantId == null) {
    return user
  }

  return {
    ...user,
    tenant: selectedTenantId,
  }
}
