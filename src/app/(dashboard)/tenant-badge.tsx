import { Tenant } from '@/types/payload-types'
import { Building2 } from 'lucide-react'

interface TenantBadgeProps {
  tenant: Tenant | null
}

export function TenantBadge({ tenant }: TenantBadgeProps) {
  if (!tenant) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
      <Building2 className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-900 truncate max-w-[200px]">
        {tenant.name}
      </span>
    </div>
  )
}
