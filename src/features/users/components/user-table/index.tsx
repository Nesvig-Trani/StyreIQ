'use client'

import { User } from '@/types/payload-types'

import { DataTable } from '@/shared'
import useUserTable from '@/features/users/hooks/useUserTable'
import { useState, useMemo } from 'react'
import { useRollCallStatus } from '@/features/compliance-tasks/hooks/roll-call-status'

export function UserTable({
  data,
  pagination,
  user,
}: {
  data: User[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
  user: User | null
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const userIds = useMemo(() => data.map((u) => u.id), [data])

  const { statusMap } = useRollCallStatus(userIds)

  const { columns } = useUserTable({
    user,
    selectedUserId,
    onOpenDetails: (userId) => setSelectedUserId(userId),
    onCloseDetails: () => setSelectedUserId(null),
    userRollCallStatus: statusMap,
  })

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
