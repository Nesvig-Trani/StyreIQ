import { getPayload } from 'payload'
import config from '@payload-config'
import { CreateOrganizationsTree } from '@/utils/createOrgTree'
import { Card, CardContent } from '@/components/ui/card'
import { UpdateUserForm } from '@/components/users/updateUserForm'
import React from 'react'
export default async function UpdateUser({ params }: { params: { id: string } }) {
  const payload = await getPayload({ config })
  if (!params.id) return <div>404</div>
  const user = await payload.findByID({
    collection: 'users',
    id: params.id,
    depth: 0,
  })

  if (!user) return <div>404</div>

  const allOrganizations = await payload.find({
    collection: 'organization',
    depth: 0,
    select: {
      id: true,
      name: true,
      parentOrg: true,
      depth: true,
      path: true,
    },
    limit: 0,
  })

  const tree = CreateOrganizationsTree(allOrganizations)
  return (
    <div>
      <h1>Update user</h1>
      <Card>
        <CardContent>
          <UpdateUserForm
            tree={tree}
            organizations={allOrganizations.docs}
            data={user}
            id={params.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
