'use client'

import { ColumnDef } from '@tanstack/table-core'
import { Button } from '@/shared'
import { CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { roleLabelMap, UserRolesEnum } from '@/features/users/schemas'
import { approveRoleRequest } from '@/sdk/request-role'
import { RoleRequest } from '@/types/payload-types'

function useRoleRequestsTable(userRole: UserRolesEnum | null) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)

  const canApprove =
    userRole === UserRolesEnum.SuperAdmin || userRole === UserRolesEnum.CentralAdmin

  const handleRoleRequestAction = async (id: number, approve: boolean) => {
    setLoading(id)
    try {
      await approveRoleRequest(id, approve)
      toast.success(`Role request ${approve ? 'approved' : 'rejected'}`)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${approve ? 'approve' : 'reject'} request`,
      )
    } finally {
      setLoading(null)
    }
  }

  const columns: ColumnDef<RoleRequest>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original.user
        const name = typeof user === 'object' ? user.name : 'Unknown'
        const email = typeof user === 'object' ? user.email : ''
        return (
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-500">{email}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'requestedRole',
      header: 'Role Requested',
      cell: ({ row }) => {
        const role = row.original.requestedRole as UserRolesEnum
        return roleLabelMap[role] || role
      },
    },
    {
      accessorKey: 'justification',
      header: 'Justification',
      cell: ({ row }) => {
        const text = row.original.justification
        return (
          <div className="max-w-md truncate" title={text}>
            {text}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const colors = {
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
        }
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors]}`}
          >
            {status}
          </span>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Requested',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return date.toLocaleDateString()
      },
    },
    ...(canApprove
      ? [
          {
            accessorKey: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: RoleRequest } }) => {
              const { id, status } = row.original

              if (status !== 'pending') {
                return <span className="text-sm text-gray-500">Processed</span>
              }

              const isLoading = loading === id

              return (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleRoleRequestAction(id, true)}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRoleRequestAction(id, false)}
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )
            },
          } as ColumnDef<RoleRequest>,
        ]
      : []),
  ]

  return {
    columns,
  }
}

export default useRoleRequestsTable
