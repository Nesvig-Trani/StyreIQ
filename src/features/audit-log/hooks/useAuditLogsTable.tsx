import { useParsedSearchParams } from '@/shared/utils/searchParams'
import { auditLogSearchSchema } from '@/features/audit-log/schemas'
import { DataTableFilter } from '@/shared/components/data-table'
import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'
import { AuditLog, User, Tenant } from '@/types/payload-types'
import { ColumnDef } from '@tanstack/table-core'
import { Badge } from '@/shared/components/ui/badge'
import { format } from 'date-fns'
import { DiffView } from '../components/diff-view'
import { actionLabels } from '../constants/actionLabels'

const ACTION_BADGE_CLASSES: Partial<Record<AuditLogActionEnum, string>> = {
  [AuditLogActionEnum.Create]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [AuditLogActionEnum.UserCreation]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [AuditLogActionEnum.ComplianceTasksGenerated]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [AuditLogActionEnum.EmailSent]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [AuditLogActionEnum.Update]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [AuditLogActionEnum.Delete]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [AuditLogActionEnum.RoleRequestRejected]:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [AuditLogActionEnum.EmailFailed]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [AuditLogActionEnum.TaskCreationFailed]:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [AuditLogActionEnum.CriticalError]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [AuditLogActionEnum.OverdueNoticeSent]:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [AuditLogActionEnum.Approval]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.RoleRequestApproved]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.TaskCompleted]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.TrainingCompleted]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.PasswordSetupCompleted]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.RollCallCompleted]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.PolicyAcknowledgement]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.TwoFAConfirmed]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.SharedPasswordConfirmed]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.UserPasswordConfirmed]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditLogActionEnum.FlagResolution]:
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  [AuditLogActionEnum.TaskEscalation]:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [AuditLogActionEnum.EscalatedToUnitAdmin]:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [AuditLogActionEnum.EscalatedToCentralAdmin]:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [AuditLogActionEnum.PasswordRecovery]:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [AuditLogActionEnum.PasswordReset]:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [AuditLogActionEnum.ReminderSent]:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
}

const DEFAULT_BADGE_CLASS = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'

function getActionBadgeClass(action: AuditLogActionEnum): string {
  return ACTION_BADGE_CLASSES[action] ?? DEFAULT_BADGE_CLASS
}

const EMPTY_AFFECTED_RECORD_MESSAGE = 'No affected record recorded'

function getAuditLogDocumentLabel(log: AuditLog): string | null {
  const doc = log.document
  if (!doc) return null
  const value = doc.value
  if (typeof value !== 'object' || value === null) return null
  if ('name' in value && typeof value.name === 'string' && value.name.length > 0) {
    return value.name
  }
  if ('flagType' in value && typeof value.flagType === 'string' && value.flagType.length > 0) {
    return value.flagType
  }
  return null
}

function getAuditLogDetailsTriggerAriaLabel(log: AuditLog): string {
  const action = actionLabels[log.action as AuditLogActionEnum] ?? log.action
  const entity = log.entity.replace(/_/g, ' ')
  const userName =
    typeof log.user === 'object' && log.user && 'name' in log.user ? log.user.name : 'Unknown user'
  const record = getAuditLogDocumentLabel(log)
  const recordClause = record ? `, ${record}` : ''
  return `View audit log details for ${action} on ${entity} by ${userName}${recordClause}`
}

function useAuditLogsTable({
  users,
  tenants,
  isViewingAllTenants,
}: {
  users: User[]
  tenants?: Tenant[]
  isViewingAllTenants?: boolean
}) {
  const searchParams = useParsedSearchParams(auditLogSearchSchema)

  const columnFiltersDefs: DataTableFilter[] = [
    {
      id: 'entity',
      title: 'Entity',
      type: 'select',
      allowMultiple: true,
      options: [
        { value: 'users', label: 'Users' },
        { value: 'organization', label: 'Units' },
        { value: 'social-medias', label: 'Social Media Accounts' },
        { value: 'flags', label: 'Risk Flags' },
        { value: 'policies', label: 'Policies' },
        { value: 'compliance_tasks', label: 'Compliance Tasks' },
      ],
    },
    {
      id: 'action',
      title: 'Action',
      type: 'select',
      allowMultiple: true,
      options: Object.values(AuditLogActionEnum).map((action) => ({
        value: action,
        label: actionLabels[action] ?? action,
      })),
    },
    {
      id: 'user',
      title: 'Modify by',
      type: 'select',
      allowMultiple: false,
      options: users.map((user) => ({
        value: user.id.toString(),
        label: user.name,
      })),
    },
    {
      id: 'createdAt',
      title: 'Created At',
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

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'user',
      header: 'Modify by',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const user = row.getValue('user') as User
        return <span>{user.name}</span>
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const action = row.getValue('action') as AuditLogActionEnum
        return (
          <Badge className={getActionBadgeClass(action)}>{actionLabels[action] ?? action}</Badge>
        )
      },
    },
    {
      accessorKey: 'entity',
      header: 'Entity',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const entity = row.getValue('entity') as string
        return <span className="capitalize">{entity.replace(/_/g, ' ')}</span>
      },
    },
    {
      accessorKey: 'document',
      header: 'Affected Record',
      cell: ({ row }) => {
        const label = getAuditLogDocumentLabel(row.original)
        if (label) return <span>{label}</span>
        return (
          <span className="text-muted-foreground text-sm">{EMPTY_AFFECTED_RECORD_MESSAGE}</span>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const createdAt = row.getValue('createdAt') as string
        return <span>{format(new Date(createdAt), 'LLL dd, y')}</span>
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
    accessorKey: 'details',
    header: 'Details',
    cell: ({ row }) => {
      const log = row.original as AuditLog
      return (
        <DiffView log={log} detailsTriggerAriaLabel={getAuditLogDetailsTriggerAriaLabel(log)} />
      )
    },
  })

  return {
    columns,
    columnFiltersDefs,
    searchParams,
  }
}

export default useAuditLogsTable
