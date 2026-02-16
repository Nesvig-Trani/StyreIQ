'use client'

import { DataTable } from '@/shared'
import { Tenant, User } from '@/types/payload-types'

import useTenantsTable from '@/features/tenants/hooks/useTenantsTable'
import { UserRolesEnum } from '@/features/users'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export default function TenantsTable({
  user,
  data,
  pagination,
}: {
  data: Tenant[]
  user: User | null
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}) {
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const isCentralAdmin = effectiveRole === UserRolesEnum.CentralAdmin
  const { columns } = useTenantsTable({ canEdit: isCentralAdmin || isSuperAdmin })

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      pageSizeOptions={[5, 10, 20]}
      pageCount={pagination.pageCount}
    />
  )
}
