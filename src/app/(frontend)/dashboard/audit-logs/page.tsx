import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { AuditLogsTable } from '@/audit-logs'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { auditLogSearchSchema } from '@/audit-logs/schemas'
import { getAuditLogs } from '@/plugins/audit-log/queries'
import { getAllUsers } from '@/users'
import { Badge } from '@/shared/components/ui/badge'

export default async function AuditLogsPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, auditLogSearchSchema)

  const auditLogs = await getAuditLogs({
    entity: parsedParams.entity,
    userId: Number(parsedParams.user),
    action: parsedParams.action,
    from: parsedParams.createdAt.from,
    to: parsedParams.createdAt.to,
    pageSize: parsedParams.pagination.pageSize,
    pageIndex: parsedParams.pagination.pageIndex,
  })

  const users = await getAllUsers()

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
              <p className="text-sm text-muted-foreground">
                Track system activities, user actions, and security events across your platform
              </p>
            </div>
          </div>
        </div>
        <AuditLogsTable
          data={auditLogs.docs}
          users={users.docs}
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
