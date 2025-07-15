import React from 'react'
import { organizationSearchSchema, OrganizationWithDepth } from '@/organizations'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getAllUsers, UserRolesEnum } from '@/users'
import OrganizationHierarchy from '@/shared/components/organization-hierarchy'
import { getOrganizationsWithFilter } from '@/plugins/organizations/queries'
import { treePaginationAndFilter } from '@/organizations/utils/treePaginationAndFilter'
import { CirclePlus } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'

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
    organizations: organizations.docs as OrganizationWithDepth[],
    search: parsedParams.search,
    pageIndex,
    pageSize,
  })

  return (
    <div>
      <Card>
        <CardContent>
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">Organizations</h2>
                  <Badge variant="secondary" className="text-xs">
                    {organizations.totalDocs} Organizations
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage organizational structure, hierarchy, and administrative settings
                </p>
              </div>
              <div className="w-full sm:w-auto">
                {user?.role === UserRolesEnum.SuperAdmin && (
                  <Button size="sm" className="w-full sm:w-auto">
                    <Link
                      className="flex items-center justify-center gap-2"
                      href="/dashboard/organizations/create"
                      prefetch={true}
                    >
                      <CirclePlus className="h-4 w-4" />
                      Create Organization
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
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
