'use client'
import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/table-core'
import { DataTable } from '@/components/data-table'
import { Organization, User } from '@/payload-types'

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue('type')}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const color = status === 'active' ? 'green' : status === 'inactive' ? 'red' : 'yellow'
      return <Badge className={`bg-${color}-100 text-${color}-800 capitalize`}>{status}</Badge>
    },
  },
  {
    accessorKey: 'parentOrg',
    header: 'Parent Org',
    cell: ({ row }) => {
      const parent = (row.getValue('parentOrg') as Organization) || { name: '-' }
      return <span>{parent.name}</span>
    },
  },
  {
    accessorKey: 'admin',
    header: 'Admin',
    cell: ({ row }) => {
      const admin = (row.getValue('admin') as User) || { name: '-' }
      return <span>{admin.name}</span>
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.getValue('email') || '-',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.getValue('phone') || '-',
  },
]
export function OrganizationTable({ data }: { data: Organization[] }) {
  return <DataTable columns={columns} data={data} />
}
