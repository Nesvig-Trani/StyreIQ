import React from 'react'
import { unitSearchSchema, UnitWithDepth } from '@/features/units'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getAllUsers } from '@/features/users'
import UnitHierarchy from '@/shared/components/organization-hierarchy'
import { getUnitsWithFilter } from '@/features/units/plugins/queries'
import { treePaginationAndFilter } from '@/features/units/utils/treePaginationAndFilter'
import { CirclePlus } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { AccessControl } from '@/shared/utils/rbac'

export default async function UnitsPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const searchParams = await props.searchParams
  const { user } = await getAuthUser()
  if (!user) {
    return (
      <Card>
        <CardContent>
          <p className="text-center text-muted-foreground">
            You must be logged in to view this page.
          </p>
        </CardContent>
      </Card>
    )
  }

  const access = new AccessControl(user)
  const parsedParams = parseSearchParamsWithSchema(searchParams, unitSearchSchema)

  const organizations = await getUnitsWithFilter({
    status: parsedParams.status,
    type: parsedParams.type,
  })

  const users = await getAllUsers()

  const { pageIndex, pageSize } = parsedParams.pagination

  const result = treePaginationAndFilter({
    organizations: organizations.docs as UnitWithDepth[],
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
                  <h2 className="text-2xl font-bold">Units</h2>
                  <Badge variant="secondary" className="text-xs">
                    {organizations.totalDocs} Units
                  </Badge>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    Build the foundation of your governance system.
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Units represent parts of your organization and follow a parent → child
                    hierarchy, just like your org chart. For example: <em>Organization</em> →{' '}
                    <em>Division</em> →<em>Department</em>. Structuring this way keeps
                    responsibility clear, prevents confusion, and ensures no account or team falls
                    through the cracks.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                {access.can('create', 'UNITS') && (
                  <Button size="sm" className="w-full sm:w-auto">
                    <Link
                      className="flex items-center justify-center gap-2"
                      href="/dashboard/units/create"
                      prefetch={true}
                    >
                      <CirclePlus className="h-4 w-4" />
                      Create Unit
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <UnitHierarchy
            organizations={result.docs}
            originalData={organizations.docs as UnitWithDepth[]}
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
