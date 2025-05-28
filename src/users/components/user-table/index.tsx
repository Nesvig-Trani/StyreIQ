'use client'

import { ColumnDef } from '@tanstack/table-core'
import { Organization, User } from '@/payload-types'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/users'
import { Button } from '@/shared/components/ui/button'
import { PencilIcon } from 'lucide-react'
import Link from 'next/link'
import { DataTable } from '@/shared'
import useUserTable from '@/users/hooks/useUserTable'

export function UserTable({
  data,
  pagination,
}: {
  data: User[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}) {
  const { columns } = useUserTable()
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
