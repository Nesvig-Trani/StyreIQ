import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent } from '@/components/ui/card'
import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table'

export default async function AuditLogsPage() {
  const payload = await getPayload({ config })
  const auditLogs = await payload.find({
    collection: 'audit_log',
    depth: 1,
  })

  return (
    <div>
      <Card>
        <CardContent>
          <AuditLogsTable data={auditLogs.docs} />
        </CardContent>
      </Card>
    </div>
  )
}
