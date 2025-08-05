'use client'
import { User, Flag, Organization } from '@/lib/payload/payload-types'
import { ColumnDef } from '@tanstack/table-core'
import { FlagSourceEnum, flagsSearchSchema, FlagStatusEnum, FlagTypeEnum } from '../schemas'
import { flagTypeLabels } from '../constants/flagTypeLabels'
import { Badge, Button, DataTableFilter, useParsedSearchParams } from '@/shared'
import { CheckIcon } from 'lucide-react'
import { getStatusColor, isActivityStale } from '../utils'
import { FlagDetails } from '../components/flag-details'
import { toast } from 'sonner'
import { markFlagAsResolved } from '@/sdk/flags'
import { useRouter } from 'next/navigation'
import { UserRolesEnum } from '@/features/users'
import { FlagHistoryModal } from '../components/flag-history'
import { flagSourceLabels } from '../constants/flagSourceLabels'
import { flagStatusLabels } from '../constants/flagStatusLabels'
import { FlagCommentsModal } from '../components/flag-comments'
import { flagTypeOptions } from '../constants/flagTypeOptions'
import { flagStatusOptions } from '../constants/flagStatusOptions'
import { OrganizationCell } from '@/features/organizations/components/organizations-cell'

function useFlagsTable({
  user,
  organizations,
}: {
  user: User | null
  organizations: Organization[]
}) {
  const router = useRouter()
  const handleMarkResolved = async (id: number) => {
    try {
      await markFlagAsResolved(id)
      toast.success('Risk flag resolved')
      router.refresh()
    } catch {
      toast.error('An error occurred while marking as resolved')
    }
  }

  const searchParams = useParsedSearchParams(flagsSearchSchema)

  const columnFiltersDefs: DataTableFilter[] = [
    {
      id: 'flagType',
      title: 'Type',
      type: 'select',
      allowMultiple: true,
      options: flagTypeOptions,
    },

    {
      id: 'status',
      title: 'Status',
      type: 'select',
      allowMultiple: true,
      options: flagStatusOptions,
    },
    {
      id: 'organizations',
      title: 'Organizations',
      type: 'select',
      allowMultiple: true,
      options: organizations.map((org) => {
        return { label: org.name, value: org.id.toString() }
      }),
    },
    {
      id: 'detectionDate',
      title: 'Detection Date',
      type: 'date-range',
      disabledDays: 'future',
    },
    {
      id: 'lastActivity',
      title: 'Last Activity',
      type: 'date-range',
      disabledDays: 'future',
    },
  ]

  const columns: ColumnDef<Flag>[] = [
    {
      accessorKey: 'flagType',
      header: 'Risk Flag Type',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const flagType = row.original.flagType as FlagTypeEnum
        return <div>{flagTypeLabels[flagType]}</div>
      },
    },
    {
      accessorKey: 'organizations',
      header: 'Organizations',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const organizations = row.original.organizations

        return organizations && organizations?.length > 0 ? (
          <OrganizationCell organizations={organizations as Organization[]} />
        ) : (
          <span> - </span>
        )
      },
    },
    {
      accessorKey: 'affectedEntity',
      header: 'Affected Entity',
      cell: ({ row }) => {
        const affectedEntity = row.original.affectedEntity
        return (
          <div>
            {typeof affectedEntity === 'object' && typeof affectedEntity?.value === 'object'
              ? affectedEntity.value.name
              : ''}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const status = row.original.status as FlagStatusEnum
        return <Badge variant={getStatusColor(status)}>{flagStatusLabels[status]}</Badge>
      },
    },
    {
      accessorKey: 'detectionDate',
      header: 'Detection Date',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const detectionDate = row.original.detectionDate
        const toDate = detectionDate && new Date(detectionDate)
        return <div className="flex gap-2 align-center">{toDate?.toLocaleString() || ''}</div>
      },
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => {
        const source = row.original.source as FlagSourceEnum
        return <Badge variant="outline">{flagSourceLabels[source]} </Badge>
      },
    },
    {
      accessorKey: 'lastActivity',
      header: 'Last Activity',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const lastActivity = row.original.lastActivity
        const toDate = lastActivity && new Date(lastActivity)
        return (
          <div className="flex gap-2 align-center">
            {lastActivity && (
              <>
                {isActivityStale(lastActivity) ? (
                  <Badge variant="destructive">{toDate?.toLocaleString()}</Badge>
                ) : (
                  <span className="text-sm">{toDate?.toLocaleString()}</span>
                )}
              </>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const { id, status } = row.original
        return (
          <div className="flex gap-2 items-center">
            <FlagDetails flag={row.original} />
            <FlagHistoryModal flagId={id} />
            <FlagCommentsModal flagId={id} />
            {status === FlagStatusEnum.PENDING && user?.role === UserRolesEnum.SuperAdmin && (
              <Button onClick={() => handleMarkResolved(id)}>
                <CheckIcon />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return {
    columns,
    columnFiltersDefs,
    searchParams,
  }
}

export default useFlagsTable
