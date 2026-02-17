'use client'

import { DataTable } from '@/shared'
import { Flag, Organization, User, Tenant, ComplianceTask } from '@/types/payload-types'
import useFlagsTable from '@/features/flags/hooks/useFlagsTable'

export default function FlagsTable({
  data,
  user,
  pagination,
  organizations,
  tenants = [],
  isViewingAllTenants = false,
  userComplianceTasks,
}: {
  data: Flag[]
  user: User | null
  organizations: Organization[]
  tenants?: Tenant[]
  isViewingAllTenants?: boolean
  userComplianceTasks: Map<number, ComplianceTask[]>
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}) {
  const { columns, columnFiltersDefs, searchParams } = useFlagsTable({
    user,
    organizations,
    tenants,
    isViewingAllTenants,
    userComplianceTasks,
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
        flagType: searchParams.flagType,
        status: searchParams.status,
        detectionDate: searchParams.detectionDate,
        lastActivity: searchParams.lastActivity,
        organizations: searchParams.organizations,
        tenant: searchParams.tenant,
      }}
    />
  )
}
