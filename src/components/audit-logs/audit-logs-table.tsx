'use client'
import { ColumnDef } from '@tanstack/table-core'
import { AuditLog, User } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table'
import { AuditLogActionEnum } from '@/plugins/audit-log/types'

export const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.getValue('user') as User
      return <span>{user.name}</span>
    },
  },
  {
    accessorKey: 'action',
    header: 'Action',
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
    cell: ({ row }) => {
      const entity = row.getValue('entity') as string
      return <span>{entity}</span>
    },
  },
  {
    accessorKey: 'document',
    header: 'Document',
    cell: ({ row }) => {
      const document = row.getValue('document') as { value: { name: string } }
      return <span>{document?.value?.name || 'Unknown'}</span>
    },
  },
]

export const AuditLogsTable = ({ data }: { data: AuditLog[] }) => {
  return (
    <div>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
