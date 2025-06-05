'use client'

import { User } from '@/payload-types'
import useReviewRequestTable from '@/review-requests/hooks/useReviewRequestTable'

import { DataTable } from '@/shared'

export function ReviewRequestTable({
  data,
  pagination,
}: {
  data: User[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}) {
  const { columns } = useReviewRequestTable()
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
