'use server'
import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { UserRolesEnum, userSearchSchema, WelcomeEmailSchema } from '@/users/schemas'
import { UserTable } from '@/users/components/user-table'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { CirclePlus } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import WelcomeEmailModal from '@/users/components/welcome-email-modal'
import { getLastWelcomeEmail } from '@/plugins/welcome-emails/queries'
import { getUsers } from '@/plugins/users/queries'

export default async function UsersPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const { user } = await getAuthUser()
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, userSearchSchema)

  const users = await getUsers({
    pageIndex: parsedParams.pagination.pageIndex + 1,
    pageSize: parsedParams.pagination.pageSize,
  })

  const welcomeEmail = await getLastWelcomeEmail()

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Users</h2>
                <Badge variant="secondary" className="text-xs">
                  {users.totalDocs} Total Users
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage user accounts, permissions, and access across your organization
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {user?.role === UserRolesEnum.SuperAdmin && (
                <>
                  <WelcomeEmailModal email={welcomeEmail as WelcomeEmailSchema} />
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    <Link href={'/dashboard/review-requests'} prefetch>
                      Review user requests
                    </Link>
                  </Button>
                </>
              )}

              <Button size="sm" className="w-full sm:w-auto">
                <Link
                  className={'flex items-center justify-center gap-2'}
                  href={'/dashboard/users/create'}
                  prefetch
                >
                  <CirclePlus className="h-4 w-4" />
                  Create User
                </Link>
              </Button>
            </div>
          </div>
        </div>
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
  )
}
