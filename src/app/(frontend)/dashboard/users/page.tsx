import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent } from '@/shared/components/ui/card'
import { userSearchSchema, UserTable } from '@/users'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'

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
          <UserTable
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
