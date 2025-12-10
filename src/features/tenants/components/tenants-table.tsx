'use client'

import { DataTable } from '@/shared'
import { Tenant, User } from '@/types/payload-types'

import useTenantsTable from '@/features/tenants/hooks/useTenantsTable'
import { UserRolesEnum } from '@/features/users'

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
  const isCentralAdmin = user?.role === UserRolesEnum.CentralAdmin
  const { columns } = useTenantsTable({ canEdit: isCentralAdmin })

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
