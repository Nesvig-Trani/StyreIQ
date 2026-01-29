import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { AuditLogsTable } from '@/features/audit-log'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { auditLogSearchSchema } from '@/features/audit-log/schemas'
import { getAuditLogs } from '@/features/audit-log/plugins/queries'
import { getAllUsers, UserRolesEnum } from '@/features/users'
import { Badge } from '@/shared/components/ui/badge'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getServerTenantContext } from '../../server-tenant-context'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { Tenant } from '@/types/payload-types'

export default async function AuditLogsPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, auditLogSearchSchema)
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin

  const auditLogs = await getAuditLogs({
    entity: parsedParams.entity,
    userId: Number(parsedParams.user),
    action: parsedParams.action,
    from: parsedParams.createdAt.from,
    to: parsedParams.createdAt.to,
    userDocumentId: parsedParams.userDocumentId ? Number(parsedParams.userDocumentId) : undefined,
    organizationDocumentId: parsedParams.organizationDocumentId
      ? Number(parsedParams.organizationDocumentId)
      : undefined,
    socialMediaDocumentId: parsedParams.socialMediaDocumentId
      ? Number(parsedParams.socialMediaDocumentId)
      : undefined,
    tenant: parsedParams.tenant?.map((t) => Number(t)),
    pageSize: parsedParams.pagination.pageSize,
    pageIndex: parsedParams.pagination.pageIndex,
  })

  const users = await getAllUsers()

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
                <h2 className="text-2xl font-bold">Audit Log</h2>
                <Badge variant="secondary" className="text-xs">
                  {auditLogs.totalDocs} Entries
                </Badge>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Stay audit-ready with a built-in record of actions.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Audit Log shows who did what and when — whether at the central level or within
                  a division or department. Use it to review changes, confirm accountability, and
                  support compliance reporting.
                </p>
              </div>
            </div>
          </div>
        </div>
        <AuditLogsTable
          data={auditLogs.docs}
          users={users.docs}
          tenants={tenants}
          isViewingAllTenants={tenantContext.isViewingAllTenants}
          pagination={{
            pageSize: auditLogs.limit,
            pageIndex: auditLogs.page ? auditLogs.page - 1 : 0,
            total: auditLogs.totalDocs,
            pageCount: auditLogs.totalPages,
          }}
        />
      </CardContent>
    </Card>
  )
}
