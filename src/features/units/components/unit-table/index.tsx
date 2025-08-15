'use client'
import { Organization } from '@/types/payload-types'
import { DataTable } from '@/shared'
import useUnitTable from '@/features/units/hooks/useUnitTable'

export function UnitTable({
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
  const { columns } = useUnitTable()

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
