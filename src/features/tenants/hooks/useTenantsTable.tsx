'use client'
import { Tenant } from '@/types/payload-types'
import { ColumnDef } from '@tanstack/table-core'

import { tenantSearchSchema } from '../schemas'
import { Button, useParsedSearchParams } from '@/shared'
import Link from 'next/link'
import { Settings, Pencil } from 'lucide-react'

function tenantRowLabel(tenant: Tenant): string {
  const name = tenant.name?.trim()
  if (name) return name
  return `Tenant #${tenant.id}`
}

function useTenantsTable({ canEdit, canEditTenant }: { canEdit: boolean; canEditTenant: boolean }) {
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
        const label = tenantRowLabel(row.original)
        return (
          <div className="flex items-center gap-2">
            {canEditTenant && (
              <Button
                className="text-white!"
                asChild
                size="icon"
                aria-label={`Edit tenant — ${label}`}
              >
                <Link href={`/dashboard/tenants/update/${row.original.id}`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
            <Button
              className="text-white!"
              asChild
              size="icon"
              aria-label={`Governance settings — ${label}`}
            >
              <Link href={`/dashboard/tenants/update-governance-settings/${row.original.id}`}>
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
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
