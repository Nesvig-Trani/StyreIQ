'use client'
import { ColumnDef } from '@tanstack/table-core'
import { Organization, User } from '@/types/payload-types'
import { Check, PencilIcon } from 'lucide-react'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/features/users'
import { Button } from '@/shared/components/ui/button'
import RejectApplicationButton from '../components/reject-request-modal'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setUserApprovalStatus } from '@/sdk/users'
import { toast } from 'sonner'
import { UnitCell } from '@/features/units/components/unit-cell'
import { normalizeRoles } from '@/shared/utils/role-hierarchy'
import { Badge } from '@/shared'

function useReviewRequestTable() {
  const router = useRouter()
  const handleApprove = async ({ id }: { id: number }) => {
    try {
      await setUserApprovalStatus({ data: { id, approved: true } })
      toast.success('User approved successfully')
      router.refresh()
    } catch {
      toast.error('An error occurred please try again later')
    }
  }

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
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const roles = normalizeRoles(row.original.roles)
        const activeRole = row.original.active_role as UserRolesEnum | undefined

        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge
                key={role}
                variant={activeRole === role ? 'default' : 'outline'}
                className="text-xs"
              >
                {roleLabelMap[role]}
                {activeRole === role && ' ★'}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        return <span>{statusLabelMap[status as UserStatusEnum]}</span>
      },
    },
    {
      accessorKey: 'organizations',
      header: 'Units',
      cell: ({ row }) => {
        const organizations = row.original.organizations as Organization[]

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
        return (
          <div className="flex gap-2">
            <RejectApplicationButton id={id} />
            <Button size="sm" onClick={() => handleApprove({ id })}>
              <Check />
            </Button>

            <Button size="sm">
              <Link href={`/dashboard/users/update/${id}`}>
                <PencilIcon />
              </Link>
            </Button>
          </div>
        )
      },
    },
  ]

  return {
    columns,
  }
}

export default useReviewRequestTable
