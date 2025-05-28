import { ColumnDef } from '@tanstack/table-core'
import { Organization, User } from '@/payload-types'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/users'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { PencilIcon } from 'lucide-react'

function useUserTable() {
  const columns: ColumnDef<User>[] = [
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

  return {
    columns,
  }
}

export default useUserTable
