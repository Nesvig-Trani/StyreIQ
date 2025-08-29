import { ColumnDef } from '@tanstack/table-core'
import { Organization, User } from '@/types/payload-types'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/features/users'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { FileLock2, PencilIcon } from 'lucide-react'
import { UnitCell } from '@/features/units/components/unit-cell'
import { Badge } from '@/shared'

function useUserTable({ user }: { user: User | null }) {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string
        return (
          <span className="block truncate max-w-[200px]" title={email}>
            {email}
          </span>
        )
      },
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
      accessorKey: 'units',
      header: 'Units',
      cell: ({ row }) => {
        const organizations = row.original.organizations as Organization[]
        if (row.original.role === UserRolesEnum.SuperAdmin) {
          return (
            <Badge variant="secondary" className="text-xs">
              StyreIq
            </Badge>
          )
        }
        return organizations && organizations?.length > 0 ? (
          <UnitCell organizations={organizations} />
        ) : (
          <span> - </span>
        )
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const id = row.original.id
        const role = row.original.role
        const isOwnRecord = user?.id === id
        return (
          <div className="flex gap-2">
            {(user?.role === UserRolesEnum.UnitAdmin ||
              user?.role === UserRolesEnum.SuperAdmin) && (
              <Button>
                <Link href={`/dashboard/users/access/${id}`}>
                  <FileLock2 />
                </Link>
              </Button>
            )}

            {(user?.role === UserRolesEnum.SuperAdmin ||
              (user?.role === UserRolesEnum.UnitAdmin &&
                role === UserRolesEnum.SocialMediaManager) ||
              (user?.role === UserRolesEnum.SocialMediaManager && isOwnRecord)) && (
              <Button>
                <Link href={`/dashboard/users/update/${id}`}>
                  <PencilIcon />
                </Link>
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return {
    columns,
  }
}

export default useUserTable
