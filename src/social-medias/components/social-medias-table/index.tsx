'use client'
import React from 'react'
import type { SocialMedia, User } from '@/payload-types'
import { DataTable } from '@/shared'
import { useSocialMediasTable } from '@/social-medias'

export type SocialMediasTableProps = {
  user: User | null
  data: SocialMedia[]
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}

export const SocialMediasTable: React.FC<SocialMediasTableProps> = ({ user, data, pagination }) => {
  const { columns } = useSocialMediasTable(user)

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
