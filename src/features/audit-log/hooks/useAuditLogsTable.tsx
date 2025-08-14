import { useParsedSearchParams } from '@/shared/utils/searchParams'
import { auditLogSearchSchema } from '@/features/audit-log/schemas'
import { DataTableFilter } from '@/shared/components/data-table'
import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'
import { AuditLog, User } from '@/types/payload-types'
import { ColumnDef } from '@tanstack/table-core'
import { Badge } from '@/shared/components/ui/badge'
import { format } from 'date-fns'
import { DiffView } from '../components/diff-view'

function useAuditLogsTable({ users }: { users: User[] }) {
  const searchParams = useParsedSearchParams(auditLogSearchSchema)

  const columnFiltersDefs: DataTableFilter[] = [
    {
      id: 'entity',
      title: 'Entity',
      type: 'select',
      allowMultiple: true,
      options: [
        { value: 'users', label: 'Users' },
        {
          value: 'units',
          label: 'Units',
        },
        {
          value: 'social-medias',
          label: 'Social Media Accounts',
        },
      ],
    },
    {
      id: 'action',
      title: 'Action',
      type: 'select',
      allowMultiple: true,
      options: [
        { value: AuditLogActionEnum.Create, label: 'Create' },
        { value: AuditLogActionEnum.Update, label: 'Update' },
        { value: AuditLogActionEnum.Delete, label: 'Delete' },
      ],
    },
    {
      id: 'user',
      title: 'User',
      type: 'select',
      allowMultiple: false,
      options: users.map((user) => ({
        value: user.id.toString(),
        label: user.name,
      })),
    },
    {
      id: 'createdAt',
      type: 'date-range',
      disabledDays: 'future',
    },
  ]

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'user',
      header: 'User',
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
        const action = row.getValue('action') as string
        const getColorClass = (action: string) => {
          switch (action.toLowerCase()) {
            case AuditLogActionEnum.Create:
              return 'bg-green-100 text-green-800'
            case AuditLogActionEnum.Update:
              return 'bg-yellow-100 text-yellow-800'
            case AuditLogActionEnum.Delete:
              return 'bg-red-100 text-red-800'
            default:
              return 'bg-gray-100 text-gray-800'
          }
        }
        return <Badge className={getColorClass(action)}>{action}</Badge>
      },
    },
    {
      accessorKey: 'entity',
      header: 'Entity',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const entity = row.getValue('entity') as string
        return <span>{entity}</span>
      },
    },
    {
      accessorKey: 'document',
      header: 'Document',
      cell: ({ row }) => {
        const document = row.getValue('document') as { value: { name: string; flagType: string } }
        return <span>{document?.value?.name || document?.value?.flagType}</span>
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
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const log = row.original as AuditLog
        return <DiffView log={log} />
      },
    },
  ]

  return {
    columns,
    columnFiltersDefs,
    searchParams,
  }
}

export default useAuditLogsTable
