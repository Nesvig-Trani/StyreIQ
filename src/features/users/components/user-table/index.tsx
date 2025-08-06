'use client'

import { User } from '@/types/payload-types'

import { DataTable } from '@/shared'
import useUserTable from '@/features/users/hooks/useUserTable'

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
  const { columns } = useUserTable({ user })
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
