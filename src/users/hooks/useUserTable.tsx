import { ColumnDef } from '@tanstack/table-core'
import { Organization, User } from '@/payload-types'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/users'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { FileLock2, PencilIcon } from 'lucide-react'
import { OrganizationCell } from '@/organizations/components/organizations-cell'

function useUserTable({ user }: { user: User | null }) {
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
      accessorKey: 'organizations',
      header: 'Organizations',
      cell: ({ row }) => {
        const organizations = row.original.organizations as Organization[]

        return organizations && organizations?.length > 0 ? (
          <OrganizationCell organizations={organizations} />
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
        return (
          <div className="flex gap-2">
            <Button>
              <Link href={`/dashboard/users/access/${id}`}>
                <FileLock2 />
              </Link>
            </Button>
            <div>
              {(user?.role === UserRolesEnum.UnitAdmin &&
                role === UserRolesEnum.SocialMediaManager) ||
              user?.role === UserRolesEnum.SuperAdmin ? (
                <Button>
                  <Link href={`/dashboard/users/update/${id}`}>
                    <PencilIcon />
                  </Link>
                </Button>
              ) : null}
            </div>
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
