'use client'
import { Organization } from '@/lib/payload/payload-types'
import { DataTable } from '@/shared'
import useOrganizationTable from '@/features/organizations/hooks/useOrganizationTable'

export function OrganizationTable({
  data,
  pagination,
}: {
  data: Organization[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}) {
  const { columns } = useOrganizationTable()

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      pageSizeOptions={[5, 10, 20]}
      pageCount={pagination.pageCount}
    />
  )
}
