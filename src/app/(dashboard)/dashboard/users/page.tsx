'use server'
import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { userSearchSchema, WelcomeEmailSchema } from '@/features/users/schemas'
import { UserTable } from '@/features/users/components/user-table'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { CirclePlus } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import WelcomeEmailModal from '@/features/users/components/welcome-email-modal'
import { getLastWelcomeEmail } from '@/features/welcome-emails/plugins/queries'
import { getUsers } from '@/features/users/plugins/queries'
import { AccessControl } from '@/shared/utils/rbac'
import { checkUserReadAccess } from '@/shared'
import { UserRolesEnum } from '@/features/users/schemas'

import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getServerTenantContext } from '../../server-tenant-context'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { Tenant } from '@/types/payload-types'

export default async function UsersPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const { user, accessDenied, component } = await checkUserReadAccess()
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const isUnitAdmin = effectiveRole === UserRolesEnum.UnitAdmin
  const isCentralAdmin = effectiveRole === UserRolesEnum.CentralAdmin
  if (accessDenied) {
    return component
  }

  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, userSearchSchema)

  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)

  const users = await getUsers({
    pageIndex: parsedParams.pagination.pageIndex + 1,
    pageSize: parsedParams.pagination.pageSize,
    tenant: parsedParams.tenant,
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

  const welcomeEmail = await getLastWelcomeEmail()
  const access = new AccessControl(user!)

  const canManageWelcomeEmail =
    access.can('update', 'WELCOME_EMAIL') && (isSuperAdmin || isCentralAdmin)
  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">Users</h2>
                <Badge variant="secondary" className="text-xs">
                  {users.totalDocs} Total Users
                </Badge>

                {isSuperAdmin && tenantContext.selectedTenant && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {tenantContext.selectedTenant.name}
                  </Badge>
                )}
                {isSuperAdmin && tenantContext.isViewingAllTenants && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                    All Tenants
                  </Badge>
                )}

                {isUnitAdmin && (
                  <Badge variant="outline" className="text-xs">
                    Filtered by your unit hierarchy
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Add everyone connected to your social media accounts.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This includes admins, back-ups, designers, student workers, or outside partners.
                  Each user is tied to a unit in your org chart so you can see every point of
                  access, track accountability, and reduce hidden risks. You can also assign
                  trainings, policy attestations, and other governance tasks directly to users.
                  {isUnitAdmin && (
                    <span className="block mt-2 text-blue-600">
                      As a Unit Admin, you can only view and manage users within your unit
                      hierarchy.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {access.can('create', 'USERS') && (
                <>
                  {canManageWelcomeEmail && (
                    <WelcomeEmailModal email={welcomeEmail as WelcomeEmailSchema} />
                  )}
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    <Link href={'/dashboard/review-requests'} prefetch>
                      Review user requests
                    </Link>
                  </Button>
                </>
              )}

              {access.can('create', 'USERS') && !tenantContext.isViewingAllTenants ? (
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
              ) : null}
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
          tenants={tenants}
          isViewingAllTenants={tenantContext.isViewingAllTenants}
        />
      </CardContent>
    </Card>
  )
}
