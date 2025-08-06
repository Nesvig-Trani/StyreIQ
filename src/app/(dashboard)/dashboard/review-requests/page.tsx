import React from 'react'
import { organizationSearchSchema } from '@/features/organizations'
import { Card, CardContent } from '@/shared/components/ui/card'
import { parseSearchParamsWithSchema } from '@/shared/utils/parseParamsServer'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getPendingActivationUsers } from '@/features/users'
import { ReviewRequestTable } from '@/features/review-requests'

export default async function ReviewRequestsPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const searchParams = await props.searchParams
  const { user } = await getAuthUser()
  const parsedParams = parseSearchParamsWithSchema(searchParams, organizationSearchSchema)
  const users = await getPendingActivationUsers({
    limit: parsedParams.pagination.pageSize,
    page: parsedParams.pagination.pageIndex + 1,
    user,
  })

  return (
    <div>
      <Card>
        <CardContent>
          <ReviewRequestTable
            data={users.docs}
            pagination={{
              pageSize: users.limit,
              pageIndex: users.page ? users.page - 1 : 0,
              total: users.totalDocs,
              pageCount: users.totalPages,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
