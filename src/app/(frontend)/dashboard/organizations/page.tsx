import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { organizationSearchSchema, OrganizationTable } from '@/organizations'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'

export default async function OrganizationsPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const payload = await getPayload({ config })
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, organizationSearchSchema)
  const organizations = await payload.find({
    collection: 'organization',
    depth: 1,
    limit: parsedParams.pagination.pageSize,
    page: parsedParams.pagination.pageIndex + 1,
  })

  return (
    <div>
      <Card>
        <div className={'flex justify-end'}>
          <Button>
            <Link href={'/dashboard/organizations/create'}>Create Organization</Link>
          </Button>
        </div>
        <CardContent>
          <OrganizationTable
            data={organizations.docs}
            pagination={{
              pageSize: organizations.limit,
              pageIndex: organizations.page ? organizations.page - 1 : 0,
              total: organizations.totalDocs,
              pageCount: organizations.totalPages,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
