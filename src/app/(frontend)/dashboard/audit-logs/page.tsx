import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { AuditLogsTable } from '@/audit-logs'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { auditLogSearchSchema } from '@/audit-logs/schemas'
import { getAuditLogs } from '@/plugins/audit-log/queries'
import { getAllUsers } from '@/users'

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
    <div>
      <Card>
        <CardContent>
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
    </div>
  )
}
