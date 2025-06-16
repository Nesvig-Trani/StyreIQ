import React from 'react'
import {
  organizationSearchSchema,
  OrganizationWithChildren,
  OrganizationWithDepth,
} from '@/organizations'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getAllUsers, UserRolesEnum } from '@/users'
import OrganizationHierarchy from '@/shared/components/organization-hierarchy'
import { getOrganizationsWithFilter } from '@/organizations/queries'
import { treePaginationAndFilter } from '@/organizations/utils/treePaginationAndFilter'

export default async function OrganizationsPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const searchParams = await props.searchParams
  const { user } = await getAuthUser()
  const parsedParams = parseSearchParamsWithSchema(searchParams, organizationSearchSchema)

  const organizations = await getOrganizationsWithFilter({
    status: parsedParams.status,
    type: parsedParams.type,
  })

  const users = await getAllUsers()

  const { pageIndex, pageSize } = parsedParams.pagination

  const result = treePaginationAndFilter({
    organizations: organizations.docs as OrganizationWithChildren[],
    search: parsedParams.search,
    pageIndex,
    pageSize,
  })

  return (
    <div>
      <Card>
        <div className={'flex justify-end'}>
          {user?.role === UserRolesEnum.SuperAdmin && (
            <Button>
              <Link href={'/dashboard/organizations/create'}>Create Organization</Link>
            </Button>
          )}
        </div>
        <CardContent>
          <OrganizationHierarchy
            organizations={result.docs}
            originalData={organizations.docs as OrganizationWithDepth[]}
            users={users.docs}
            user={user}
            pagination={{
              pageSize: result.limit,
              pageIndex: result.page ? result.page - 1 : 0,
              total: result.totalDocs,
              pageCount: result.totalPages,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
