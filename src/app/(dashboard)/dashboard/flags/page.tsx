import React from 'react'
import FlagsTable from '@/features/flags/components/flags-table'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { Badge, Button, Card, CardContent, parseSearchParamsWithSchema } from '@/shared'
import { flagsSearchSchema } from '@/features/flags/schemas'
import { getFlags } from '@/features/flags/plugins/queries'
import Link from 'next/link'
import { CirclePlus } from 'lucide-react'
import { getAllUnits } from '@/features/units/plugins/queries'
import { getServerTenantContext } from '../../server-tenant-context'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { UserRolesEnum } from '@/features/users'
import { Tenant } from '@/types/payload-types'
import { getComplianceTasksByUserIds } from '@/features/compliance-tasks/plugins/queries'

export default async function FlagsPage(props: {
  searchParams?: Promise<{ [key: string]: string }>
}) {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, flagsSearchSchema)
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin

  const flags = await getFlags({
    flagType: parsedParams.flagType,
    status: parsedParams.status,
    lastActivityTo: parsedParams.lastActivity.to,
    lastActivityFrom: parsedParams.lastActivity.from,
    detectionDateFrom: parsedParams.detectionDate.from,
    detectionDateTo: parsedParams.detectionDate.to,
    organizations: parsedParams.organizations?.map((org) => Number(org)),
    tenant: parsedParams.tenant?.map((t) => Number(t)),
    pageSize: parsedParams.pagination.pageSize,
    pageIndex: parsedParams.pagination.pageIndex,
  })

  const userIds = flags.docs
    .map((flag) => {
      const entity = flag.affectedEntity
      if (entity?.relationTo === 'users') {
        const value = entity.value
        return typeof value === 'object' ? value.id : value
      }
      return null
    })
    .filter((id): id is number => id !== null)

  const userComplianceTasks = await getComplianceTasksByUserIds(userIds)

  const organizations = await getAllUnits()

  let tenants: Tenant[] = []
  if (isSuperAdmin && tenantContext.isViewingAllTenants) {
    const tenantsResult = await payload.find({
      collection: 'tenants',
      limit: 0,
      depth: 0,
    })
    tenants = tenantsResult.docs
  }

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Risk Flags</h2>
                <Badge variant="secondary" className="text-xs">
                  {flags.totalDocs} Total Flags
                </Badge>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Spot issues before they become problems.</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Flags help you identify risks like inactive accounts, missing connected users, or
                  compliance gaps. Assign them to the right people so nothing is overlooked and
                  everyone knows what needs attention.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {!tenantContext.isViewingAllTenants && (
                <Button size="sm" className="w-full sm:w-auto">
                  <Link
                    className="flex items-center justify-center gap-2"
                    href="/dashboard/flags/create"
                    prefetch
                  >
                    <CirclePlus className="h-4 w-4" />
                    Create Risk Flag
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <FlagsTable
          user={user}
          data={flags.docs}
          organizations={organizations.docs}
          tenants={tenants}
          isViewingAllTenants={tenantContext.isViewingAllTenants}
          userComplianceTasks={userComplianceTasks}
          pagination={{
            pageSize: flags.limit,
            pageIndex: flags.page ? flags.page - 1 : 0,
            total: flags.totalDocs,
            pageCount: flags.totalPages,
          }}
        />
      </CardContent>
    </Card>
  )
}
