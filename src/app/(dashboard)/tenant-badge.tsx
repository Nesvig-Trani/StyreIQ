import { UserRolesEnum } from '@/features/users'
import { Tenant } from '@/types/payload-types'
import { Building2, Globe } from 'lucide-react'

interface TenantBadgeProps {
  tenant: Tenant | null
  isViewingAllTenants?: boolean
  userRole?: UserRolesEnum
}

export function TenantBadge({ tenant, isViewingAllTenants, userRole }: TenantBadgeProps) {
  if (userRole === UserRolesEnum.SuperAdmin && isViewingAllTenants) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg">
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
          All Tenants
        </span>
      </div>
    )
  }

  if (tenant) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
        <Building2 className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900 truncate max-w-[200px]">
          {tenant.name}
        </span>
      </div>
    )
  }

  return null
}
