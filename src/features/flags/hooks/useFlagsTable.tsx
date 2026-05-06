'use client'
import { User, Flag, Organization, Tenant, ComplianceTask } from '@/types/payload-types'
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
import { UnitCell } from '@/features/units/components/unit-cell'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

const EMPTY_FLAG_TYPE_MESSAGE = 'No risk flag type recorded'

function getFlagRowAriaContext(flag: Flag): string {
  const parts: string[] = [`flag #${flag.id}`]

  const tenant = flag.tenant
  if (tenant && typeof tenant === 'object' && 'name' in tenant) {
    parts.push(`tenant ${(tenant as Tenant).name}`)
  }

  if (typeof flag.flagType === 'string' && flag.flagType in flagTypeLabels) {
    parts.push(flagTypeLabels[flag.flagType as FlagTypeEnum])
  }

  const affectedValue = flag.affectedEntity?.value
  if (affectedValue && typeof affectedValue === 'object' && 'name' in affectedValue) {
    parts.push(`affected ${(affectedValue as { name: string }).name}`)
  }

  return parts.join(', ')
}

function useFlagsTable({
  user,
  organizations,
  tenants,
  isViewingAllTenants,
  userComplianceTasks,
}: {
  user: User | null
  organizations: Organization[]
  tenants?: Tenant[]
  isViewingAllTenants?: boolean
  userComplianceTasks: Map<number, ComplianceTask[]>
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
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin

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
      options: organizations.map((org) => ({ label: org.name, value: org.id.toString() })),
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

  if (isViewingAllTenants && tenants && tenants.length > 0) {
    columnFiltersDefs.push({
      id: 'tenant',
      title: 'Tenant',
      type: 'select',
      allowMultiple: true,
      options: tenants.map((tenant) => ({
        label: tenant.name,
        value: tenant.id.toString(),
      })),
    })
  }

  const columns: ColumnDef<Flag>[] = [
    {
      accessorKey: 'flagType',
      header: 'Risk Flag Type',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const raw = row.original.flagType
        if (typeof raw === 'string' && raw in flagTypeLabels) {
          return <div>{flagTypeLabels[raw as FlagTypeEnum]}</div>
        }
        return <span className="text-muted-foreground text-sm">{EMPTY_FLAG_TYPE_MESSAGE}</span>
      },
    },
    {
      accessorKey: 'organizations',
      header: 'Organizations',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const organizations = row.original.organizations

        return organizations && organizations.length > 0 ? (
          <UnitCell organizations={organizations as Organization[]} />
        ) : (
          <span>-</span>
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
        const { detectionDate } = row.original
        return (
          <div className="flex gap-2 items-center">
            {detectionDate ? new Date(detectionDate).toLocaleString() : ''}
          </div>
        )
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
        const { lastActivity } = row.original
        if (!lastActivity) return null
        const formatted = new Date(lastActivity).toLocaleString()
        return (
          <div className="flex gap-2 items-center">
            {isActivityStale(lastActivity) ? (
              <Badge variant="destructive">{formatted}</Badge>
            ) : (
              <span className="text-sm">{formatted}</span>
            )}
          </div>
        )
      },
    },
  ]

  if (isViewingAllTenants) {
    columns.push({
      accessorKey: 'tenant',
      header: 'Tenant',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const tenant = row.original.tenant

        if (tenant && typeof tenant === 'object' && 'name' in tenant) {
          return (
            <Badge variant="outline" className="text-xs">
              {tenant.name}
            </Badge>
          )
        }

        return <span className="text-gray-400">-</span>
      },
    })
  }

  columns.push({
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const { id, status } = row.original
      const rowCtx = getFlagRowAriaContext(row.original)
      return (
        <div className="flex gap-2 items-center">
          <FlagDetails
            flag={row.original}
            userComplianceTasks={userComplianceTasks}
            triggerAriaLabel={`View risk flag details for ${rowCtx}`}
          />
          <FlagHistoryModal flagId={id} triggerAriaLabel={`View flag history for ${rowCtx}`} />
          <FlagCommentsModal
            flagId={id}
            triggerAriaLabel={`View flag comments for ${rowCtx}`}
            observationTextareaAriaLabel={`Add observation for ${rowCtx}`}
          />
          {status === FlagStatusEnum.PENDING && isSuperAdmin && (
            <Button
              onClick={() => handleMarkResolved(id)}
              aria-label={`Resolve risk flag for ${rowCtx}`}
            >
              <CheckIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      )
    },
  })

  return {
    columns,
    columnFiltersDefs,
    searchParams,
  }
}

export default useFlagsTable
