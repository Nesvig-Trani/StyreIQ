'use client'

import { AuditLog, User, Tenant } from '@/types/payload-types'
import { DataTable } from '@/shared'
import useAuditLogsTable from '../../hooks/useAuditLogsTable'
import { CustomFilters } from './customFilters'

export const AuditLogsTable = ({
  data,
  users,
  tenants = [],
  isViewingAllTenants = false,
  pagination,
}: {
  data: AuditLog[]
  users: User[]
  tenants?: Tenant[]
  isViewingAllTenants?: boolean
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}) => {
  const { columns, columnFiltersDefs, searchParams } = useAuditLogsTable({
    users,
    tenants,
    isViewingAllTenants,
  })
  return (
    <div>
      <CustomFilters audilogs={data} searchParams={searchParams} />

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        pageSizeOptions={[5, 10, 20]}
        pageCount={pagination.pageCount}
        columnFiltersDefs={columnFiltersDefs}
        columnFilters={{
          entity: searchParams.entity,
          action: searchParams.action,
          user: searchParams.user,
          createdAt: searchParams.createdAt,
          tenant: searchParams.tenant,
        }}
      />
    </div>
  )
}
