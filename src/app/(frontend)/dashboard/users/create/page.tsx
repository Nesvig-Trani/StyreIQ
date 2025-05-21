import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/components/ui/card'
import { CreateUserForm } from '@/components/users/createUserForm'
import { CreateOrganizationsTree } from '@/utils/createOrgTree'

export default async function CreateUserPage() {
  const payload = await getPayload({ config })

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
      <h1>Create User</h1>
      <Card>
        <CreateUserForm tree={tree} organizations={allOrganizations.docs} />
      </Card>
    </div>
  )
}
