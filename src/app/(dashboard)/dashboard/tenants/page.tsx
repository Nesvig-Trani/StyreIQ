import React from 'react'
import { Badge, Button, Card, CardContent, parseSearchParamsWithSchema } from '@/shared'
import Link from 'next/link'
import { CirclePlus } from 'lucide-react'
import { getTenants } from '@/features/tenants/plugins/queries'
import { tenantSearchSchema } from '@/features/tenants/schemas'
import TenantsTable from '@/features/tenants/components/tenants-table'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/features/users'

export default async function TenantsPage(props: {
  searchParams?: Promise<{ [key: string]: string }>
}) {
  const { user } = await getAuthUser()
  const searchParams = await props.searchParams

  const parsedParams = parseSearchParamsWithSchema(searchParams, tenantSearchSchema)

  const tenants = await getTenants({
    tenantIds: parsedParams.tenantId,
    pageSize: parsedParams.pagination.pageSize,
    pageIndex: parsedParams.pagination.pageIndex,
  })

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Tenants</h2>
                <Badge variant="secondary" className="text-xs">
                  {tenants.totalDocs} Total Tenants
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {user?.role === UserRolesEnum.SuperAdmin && (
                <Button size="sm" className="w-full sm:w-auto">
                  <Link
                    className="flex items-center justify-center gap-2"
                    href="/dashboard/tenants/create"
                    prefetch
                  >
                    <CirclePlus className="h-4 w-4" />
                    Create Tenant
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <TenantsTable
          user={user}
          data={tenants.docs}
          pagination={{
            pageSize: tenants.limit,
            pageIndex: tenants.page ? tenants.page - 1 : 0,
            total: tenants.totalDocs,
            pageCount: tenants.totalPages,
          }}
        />
      </CardContent>
    </Card>
  )
}
