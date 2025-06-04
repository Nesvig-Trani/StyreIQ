'use server'
import React from 'react'
import { PaginatedDocs } from 'payload'
import { Card, CardContent } from '@/shared/components/ui/card'
import { userSearchSchema, UserTable } from '@/users'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { getUsers } from '@/sdk/users'
import { User } from '@/payload-types'
import { getAuthUser } from '@/auth/utils/getAuthUser'

export default async function UsersPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const { user, headers } = await getAuthUser()
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, userSearchSchema)

  const users: PaginatedDocs<User> = await getUsers({
    params: {
      page: String(parsedParams.pagination.pageIndex + 1),
      limit: String(parsedParams.pagination.pageSize),
    },
    cookie: headers.get('cookie') || '',
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
            user={user}
          />
        </CardContent>
      </Card>
    </div>
  )
}
