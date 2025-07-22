'use client'
import React from 'react'
import type { Organization, SocialMedia, User } from '@/payload-types'
import { DataTable } from '@/shared'
import { useSocialMediasTable } from '@/social-medias'

export type SocialMediasTableProps = {
  user: User | null
  data: SocialMedia[]
  organizations: Organization[]
  users: User[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}

export const SocialMediasTable: React.FC<SocialMediasTableProps> = ({
  user,
  data,
  organizations,
  users,
  pagination,
}) => {
  const { columns, columnFiltersDefs, searchParams } = useSocialMediasTable({
    user,
    organizations,
    users,
  })

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      pageSizeOptions={[5, 10, 20]}
      pageCount={pagination.pageCount}
      columnFiltersDefs={columnFiltersDefs}
      columnFilters={{
        status: searchParams.status,
        platform: searchParams.platform,
        organization: searchParams.organization,
        primaryAdmin: searchParams.primaryAdmin,
      }}
    />
  )
}
