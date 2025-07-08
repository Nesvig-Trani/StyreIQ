import React from 'react'
import FlagsTable from '@/flags/components/flags-table'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { Button, Card, CardContent, parseSearchParamsWithSchema } from '@/shared'
import { flagsSearchSchema } from '@/flags/schemas'
import { getFlags } from '@/plugins/flags/queries'
import Link from 'next/link'
import { CirclePlus } from 'lucide-react'
import { getAllOrganizations } from '@/plugins/organizations/queries'

export default async function FlagsPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
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
        <div className={'flex justify-end gap-4'}>
          <Button size="sm">
            <Link className={'flex items-center gap-2'} href={'/dashboard/flags/create'} prefetch>
              <CirclePlus />
              Create Risk Flag
            </Link>
          </Button>
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
