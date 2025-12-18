import React from 'react'
import Link from 'next/link'
import { CirclePlus } from 'lucide-react'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/features/users'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { serverAuthGuard } from '@/features/auth/hooks/serverAuthGuard'
import { getRoleRequests } from '@/features/role-request/plugins/queries'
import { Badge, Button, Card, CardContent } from '@/shared'
import RoleRequestsTable from '@/features/role-request/components/RoleRequestsTable'
import { RoleRequestStatus } from '@/features/role-request/schemas'

export default async function RoleRequestsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await serverAuthGuard()
  const { user } = await getAuthUser()
  const effectiveRole = getEffectiveRoleFromUser(user)

  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const isCentralAdmin = effectiveRole === UserRolesEnum.CentralAdmin
  const canApprove = isSuperAdmin || isCentralAdmin

  const searchParams = await props.searchParams

  const pageSize = searchParams?.pageSize ? Number(searchParams.pageSize) : 10
  const pageIndex = searchParams?.page ? Number(searchParams.page) : 0
  const status = searchParams?.status as RoleRequestStatus | undefined

  const requests = await getRoleRequests({
    status,
    pageSize,
    pageIndex,
  })

  const pageContent = {
    title: canApprove ? 'Role Requests' : 'My Role Requests',
    description: canApprove
      ? 'Review and approve role requests from users in your organization'
      : 'View the status of your role requests and submit new ones',
    buttonText: 'Role request',
  }

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{pageContent.title}</h2>
                <Badge variant="secondary" className="text-xs">
                  {requests.totalDocs} {canApprove ? 'Total' : 'Requests'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{pageContent.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {isSuperAdmin && (
                <Button size="sm" className="w-full sm:w-auto">
                  <Link
                    className="flex items-center justify-center gap-2"
                    href="/dashboard/role-request/create"
                    prefetch
                  >
                    <CirclePlus className="h-4 w-4" />
                    {pageContent.buttonText}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <RoleRequestsTable
          data={requests.docs}
          userRole={effectiveRole}
          pagination={{
            pageSize: requests.limit,
            pageIndex: requests.page ? requests.page - 1 : 0,
            total: requests.totalDocs,
            pageCount: requests.totalPages,
          }}
        />
      </CardContent>
    </Card>
  )
}
