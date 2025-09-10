import { ColumnDef } from '@tanstack/table-core'
import { Organization, User } from '@/types/payload-types'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/features/users'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { EyeIcon, FileLock2, PencilIcon } from 'lucide-react'
import { UnitCell } from '@/features/units/components/unit-cell'
import { Badge } from '@/shared'
import { UserDetailsDialog } from '../components/details'

function useUserTable({
  user,
  selectedUserId,
  onOpenDetails,
  onCloseDetails,
}: {
  user: User | null
  selectedUserId: string | null
  onOpenDetails: (userId: string) => void
  onCloseDetails: () => void
}) {
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
        const isDialogOpen = selectedUserId === id.toString()

        const canViewDetails =
          user?.role === UserRolesEnum.SuperAdmin ||
          user?.role === UserRolesEnum.UnitAdmin ||
          user?.role === UserRolesEnum.SocialMediaManager

        const canEdit =
          user?.role === UserRolesEnum.SuperAdmin ||
          (user?.role === UserRolesEnum.UnitAdmin && role === UserRolesEnum.SocialMediaManager) ||
          (user?.role === UserRolesEnum.SocialMediaManager && isOwnRecord)

        const canManageAccess =
          user?.role === UserRolesEnum.UnitAdmin || user?.role === UserRolesEnum.SuperAdmin

        return (
          <div className="flex gap-2">
            {canViewDetails && (
              <UserDetailsDialog
                user={row.original}
                isOpen={isDialogOpen}
                onOpenChange={(open) => {
                  if (open) {
                    onOpenDetails(id.toString())
                  } else {
                    onCloseDetails()
                  }
                }}
                trigger={
                  <Button size="icon" variant="outline" aria-label="View user details">
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                }
              />
            )}

            {canManageAccess && role !== UserRolesEnum.SuperAdmin && (
              <Button size="icon" variant="outline">
                <Link href={`/dashboard/users/access/${id}`}>
                  <FileLock2 className="h-4 w-4" />
                </Link>
              </Button>
            )}

            {canEdit && (
              <Button size="icon">
                <Link href={`/dashboard/users/update/${id}`}>
                  <PencilIcon className="h-4 w-4" />
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
