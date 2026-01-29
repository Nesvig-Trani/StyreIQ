'use client'

import { DataTable } from '@/shared'
import useRoleRequestsTable from '../hooks/useRoleRequestsTable'
import { RoleRequest, Tenant } from '@/types/payload-types'
import { UserRolesEnum } from '@/features/users'

export default function RoleRequestsTable({
  data,
  pagination,
  userRole,
  tenants = [],
  isViewingAllTenants = false,
}: {
  data: RoleRequest[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
  userRole: UserRolesEnum | null
  tenants?: Tenant[]
  isViewingAllTenants?: boolean
}) {
  const { columns, columnFiltersDefs, searchParams } = useRoleRequestsTable({
    userRole,
    tenants,
    isViewingAllTenants,
  })

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      pageSizeOptions={[5, 10, 20]}
      pageCount={pagination.pageCount}
      columnFiltersDefs={columnFiltersDefs}
      columnFilters={{
        status: searchParams.status,
        tenant: searchParams.tenant,
      }}
    />
  )
}
