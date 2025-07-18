import React from 'react'
import FlagsTable from '@/flags/components/flags-table'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { Badge, Button, Card, CardContent, parseSearchParamsWithSchema } from '@/shared'
import { flagsSearchSchema } from '@/flags/schemas'
import { getFlags } from '@/plugins/flags/queries'
import Link from 'next/link'
import { CirclePlus } from 'lucide-react'
import { getAllOrganizations } from '@/plugins/organizations/queries'

export default async function FlagsPage(props: {
  searchParams?: Promise<{ [key: string]: string }>
}) {
  const { user } = await getAuthUser()
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, flagsSearchSchema)

  const flags = await getFlags({
    flagType: parsedParams.flagType,
    status: parsedParams.status,
    lastActivityTo: parsedParams.lastActivity.to,
    lastActivityFrom: parsedParams.lastActivity.from,
    detectionDateFrom: parsedParams.detectionDate.from,
    detectionDateTo: parsedParams.detectionDate.to,
    organization: Number(parsedParams.organization),
    pageSize: parsedParams.pagination.pageSize,
    pageIndex: parsedParams.pagination.pageIndex,
  })

  const organizations = await getAllOrganizations()

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
              <p className="text-sm text-muted-foreground">
                Monitor and manage risk flags detected in your organization
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
            </div>
          </div>
        </div>

        <FlagsTable
          user={user}
          data={flags.docs}
          organizations={organizations.docs}
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
