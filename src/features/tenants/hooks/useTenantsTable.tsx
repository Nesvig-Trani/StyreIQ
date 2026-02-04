'use client'
import { Tenant } from '@/types/payload-types'
import { ColumnDef } from '@tanstack/table-core'

import { tenantSearchSchema } from '../schemas'
import { Button, useParsedSearchParams } from '@/shared'
import Link from 'next/link'
import { Settings } from 'lucide-react'

function useTenantsTable({ canEdit }: { canEdit: boolean }) {
  const searchParams = useParsedSearchParams(tenantSearchSchema)

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'domain',
      header: 'Domain',
      enableColumnFilter: true,
    },
  ]

  if (canEdit) {
    columns.push({
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <Button
            className="text-white!"
            asChild
            size="icon"
            aria-label="Configure governance settings"
          >
            <Link href={`/dashboard/tenants/update/${row.original.id}`}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        )
      },
    })
  }

  return {
    columns,
    searchParams,
  }
}

export default useTenantsTable
