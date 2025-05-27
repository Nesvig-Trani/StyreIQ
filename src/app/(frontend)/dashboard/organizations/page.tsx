import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { OrganizationTable } from '@/components/organizations/organizationTable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { z } from 'zod'
import { parseSearchParamsWithSchema } from '@/utils/parseParamsServer'

const organizationSearchSchema = z.object({
  pagination: z
    .object({
      pageSize: z.number().catch(10),
      pageIndex: z.number().catch(0),
    })
    .catch({ pageSize: 10, pageIndex: 0 }),
})

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
