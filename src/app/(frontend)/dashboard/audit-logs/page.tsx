import React from 'react'
import { getPayload, Where } from 'payload'
import config from '@payload-config'
import { Card, CardContent } from '@/components/ui/card'
import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table'
import { parseSearchParamsWithSchema } from '@/utils/parseParamsServer'
import { z } from 'zod'
import { endOfDay, startOfDay } from 'date-fns'

const auditLogSearchSchema = z.object({
  pagination: z
    .object({
      pageSize: z.number().catch(10),
      pageIndex: z.number().catch(0),
    })
    .catch({ pageSize: 10, pageIndex: 0 }),
  entity: z.array(z.string()).catch([]),
  action: z.array(z.string()).catch([]),
  user: z.string().catch(''),
  createdAt: z
    .object({
      from: z.string().catch(''),
      to: z.string().catch(''),
    })
    .catch({ from: '', to: '' }),
})

export default async function AuditLogsPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const payload = await getPayload({ config })
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, auditLogSearchSchema)

  const where: Where = {}
  if (parsedParams.entity.length > 0) {
    where.entity = { in: parsedParams.entity }
  }

  if (parsedParams.action.length > 0) {
    where.action = { in: parsedParams.action }
  }

  if (parsedParams.user) {
    where.user = { equals: parsedParams.user }
  }

  if (parsedParams.createdAt?.from) {
    where.createdAt = { greater_than_equal: startOfDay(new Date(parsedParams.createdAt.from)) }
  }

  if (parsedParams.createdAt?.to) {
    where.createdAt = { less_than_equal: endOfDay(new Date(parsedParams.createdAt.to)) }
  }

  const auditLogs = await payload.find({
    collection: 'audit_log',
    depth: 1,
    limit: parsedParams.pagination.pageSize,
    page: parsedParams.pagination.pageIndex + 1,
    where,
  })

  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 0,
  })

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
