'use client'

import { Tenant, User } from '@/types/payload-types'

import { DataTable } from '@/shared'
import useUserTable from '@/features/users/hooks/useUserTable'
import { useState, useMemo } from 'react'
import { useRollCallStatus } from '@/features/compliance-tasks/hooks/roll-call-status'

export function UserTable({
  data,
  pagination,
  user,
  tenants = [],
  isViewingAllTenants = false,
}: {
  data: User[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
  user: User | null
  tenants?: Tenant[]
  isViewingAllTenants?: boolean
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const userIds = useMemo(() => data.map((u) => u.id), [data])

  const { statusMap } = useRollCallStatus(userIds)

  const { columns, columnFiltersDefs, searchParams } = useUserTable({
    user,
    selectedUserId,
    onOpenDetails: (userId) => setSelectedUserId(userId),
    onCloseDetails: () => setSelectedUserId(null),
    userRollCallStatus: statusMap,
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
        tenant: searchParams.tenant,
      }}
    />
  )
}
