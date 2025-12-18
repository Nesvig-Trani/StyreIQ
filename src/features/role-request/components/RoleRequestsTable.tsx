'use client'

import { DataTable } from '@/shared'
import useRoleRequestsTable from '../hooks/useRoleRequestsTable'
import { RoleRequest } from '@/types/payload-types'
import { UserRolesEnum } from '@/features/users'

export default function RoleRequestsTable({
  data,
  pagination,
  userRole,
}: {
  data: RoleRequest[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
  userRole: UserRolesEnum | null
}) {
  const { columns } = useRoleRequestsTable(userRole)
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
