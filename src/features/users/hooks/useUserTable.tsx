import { ColumnDef } from '@tanstack/table-core'
import { Organization, User } from '@/types/payload-types'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/features/users'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { EyeIcon, FileLock2, PencilIcon } from 'lucide-react'
import { UnitCell } from '@/features/units/components/unit-cell'
import { Badge } from '@/shared'
import { UserDetailsDialog } from '../components/details'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

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
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const roles = row.getValue('roles') as UserRolesEnum[]

        if (!Array.isArray(roles) || roles.length === 0) {
          return <span className="text-gray-400">No roles</span>
        }

        const roleLabels = roles
          .map((role) => roleLabelMap[role])
          .filter(Boolean)
          .join(', ')

        return <span>{roleLabels}</span>
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
        const effectiveRole = getEffectiveRoleFromUser(row.original)
        if (effectiveRole === UserRolesEnum.SuperAdmin) {
          return (
            <Badge variant="secondary" className="text-xs">
              StyreIQ
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
        const effectiveRole = getEffectiveRoleFromUser(user)
        const isOwnRecord = user?.id === id
        const isDialogOpen = selectedUserId === id.toString()

        const canViewDetails =
          effectiveRole === UserRolesEnum.SuperAdmin ||
          effectiveRole === UserRolesEnum.UnitAdmin ||
          effectiveRole === UserRolesEnum.SocialMediaManager

        const canEdit =
          effectiveRole === UserRolesEnum.SuperAdmin ||
          effectiveRole === UserRolesEnum.UnitAdmin ||
          (effectiveRole === UserRolesEnum.SocialMediaManager && isOwnRecord)

        const canManageAccess =
          effectiveRole === UserRolesEnum.UnitAdmin || effectiveRole === UserRolesEnum.SuperAdmin

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

            {canManageAccess && effectiveRole !== UserRolesEnum.SuperAdmin && (
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
