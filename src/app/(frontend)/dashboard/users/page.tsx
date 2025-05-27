import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent } from '@/components/ui/card'
import { UsersTable } from '@/components/users/usersTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { z } from 'zod'
import { parseSearchParamsWithSchema } from '@/utils/parseParamsServer'

const userSearchSchema = z.object({
  pagination: z
    .object({
      pageSize: z.number().catch(10),
      pageIndex: z.number().catch(0),
    })
    .catch({ pageSize: 10, pageIndex: 0 }),
})

export default async function UsersPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const payload = await getPayload({ config })
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, userSearchSchema)

  const users = await payload.find({
    collection: 'users',
    depth: 1,
    limit: parsedParams.pagination.pageSize,
    page: parsedParams.pagination.pageIndex + 1,
  })
  return (
    <div>
      <Card>
        <div className={'flex justify-end'}>
          <Button>
            <Link href={'/dashboard/users/create'}>Create User</Link>
          </Button>
        </div>
        <CardContent>
          <UsersTable
            data={users.docs}
            pagination={{
              pageSize: users.limit,
              pageIndex: users.page ? users.page - 1 : 0,
              total: users.totalDocs,
              pageCount: users.totalPages,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
