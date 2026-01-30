import React from 'react'
import Link from 'next/link'
import { CirclePlus } from 'lucide-react'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/features/users'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { serverAuthGuard } from '@/features/auth/hooks/serverAuthGuard'
import { getRoleRequests } from '@/features/role-request/plugins/queries'
import { Badge, Button, Card, CardContent, parseSearchParamsWithSchema } from '@/shared'
import RoleRequestsTable from '@/features/role-request/components/RoleRequestsTable'
import { roleRequestSearchSchema, RoleRequestStatus } from '@/features/role-request/schemas'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getServerTenantContext } from '../../server-tenant-context'
import { Tenant } from '@/types/payload-types'

export default async function RoleRequestsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await serverAuthGuard()
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)
  const effectiveRole = getEffectiveRoleFromUser(user)

  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const isCentralAdmin = effectiveRole === UserRolesEnum.CentralAdmin
  const canApprove = isSuperAdmin || isCentralAdmin

  const searchParams = await props.searchParams
  const parsedParams = parseSearchParamsWithSchema(searchParams, roleRequestSearchSchema)

  const requests = await getRoleRequests({
    status: parsedParams.status?.[0] as RoleRequestStatus,
    tenant: parsedParams.tenant?.map((t) => Number(t)),
    pageSize: parsedParams.pagination.pageSize,
    pageIndex: parsedParams.pagination.pageIndex,
  })

  let tenants: Tenant[] = []
  if (isSuperAdmin && tenantContext.isViewingAllTenants) {
    const tenantsResult = await payload.find({
      collection: 'tenants',
      limit: 0,
      depth: 0,
    })
    tenants = tenantsResult.docs
  }

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
              {!isSuperAdmin && !tenantContext.isViewingAllTenants && (
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
          tenants={tenants}
          isViewingAllTenants={tenantContext.isViewingAllTenants}
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
