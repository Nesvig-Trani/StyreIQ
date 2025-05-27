'use client'

import { ColumnDef } from '@tanstack/table-core'
import { Organization, User } from '@/payload-types'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/types/users'
import { Button } from '@/components/ui/button'
import { PencilIcon } from 'lucide-react'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role')
      return <span>{roleLabelMap[role as UserRolesEnum]}</span>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status')
      return <span>{statusLabelMap[status as UserStatusEnum]}</span>
    },
  },
  {
    accessorKey: 'organization',
    header: 'Organization',
    cell: ({ row }) => {
      const organization = (row.getValue('organization') as Organization) || { name: '-' }
      return <span>{organization.name}</span>
    },
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const id = row.original.id
      return (
        <Button>
          <Link href={`/dashboard/users/update/${id}`}>
            <PencilIcon />
          </Link>
        </Button>
      )
    },
  },
]

export function UsersTable({
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
