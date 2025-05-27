'use client'
import { ColumnDef } from '@tanstack/table-core'
import { AuditLog, User } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import { AuditLogActionEnum } from '@/plugins/audit-log/types'
import { DataTable, DataTableFilter } from '@/components/data-table'
import { z } from 'zod'
import { useParsedSearchParams } from '@/utils/searchParams'
import { format } from 'date-fns'

const searchParamsSchema = z.object({
  pagination: z
    .object({
      pageIndex: z.number().int().nonnegative(),
      pageSize: z.number().int().positive(),
    })
    .catch({ pageIndex: 0, pageSize: 10 }),
  entity: z.array(z.string()).optional().catch(undefined),
  action: z.array(z.string()).optional().catch(undefined),
  user: z.string().optional().catch(undefined),
  createdAt: z
    .object({
      from: z.string().optional().catch(undefined),
      to: z.string().optional().catch(undefined),
    })
    .optional()
    .catch(undefined),
})

export const columns: ColumnDef<AuditLog>[] = [
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
      const document = row.getValue('document') as { value: { name: string } }
      return <span>{document?.value?.name || 'Unknown'}</span>
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

export const AuditLogsTable = ({
  data,
  users,
  pagination,
}: {
  data: AuditLog[]
  users: User[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}) => {
  const searchParams = useParsedSearchParams(searchParamsSchema)

  const columnFiltersDefs: DataTableFilter[] = [
    {
      id: 'entity',
      title: 'Entity',
      type: 'select',
      allowMultiple: true,
      options: [
        { value: 'users', label: 'Users' },
        {
          value: 'organization',
          label: 'Organizations',
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

  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        pageSizeOptions={[5, 10, 20]}
        pageCount={pagination.pageCount}
        columnFiltersDefs={columnFiltersDefs}
        columnFilters={{
          entity: searchParams.entity,
          action: searchParams.action,
          user: searchParams.user,
          createdAt: searchParams.createdAt,
        }}
      />
    </div>
  )
}
