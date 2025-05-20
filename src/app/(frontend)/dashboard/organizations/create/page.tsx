import React from 'react'
import { CreateOrgForm } from '@/components/organizations/createOrgForm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/components/ui/card'
import { CreateOrganizationsTree } from '@/utils/createOrgTree'

export default async function CreateOrganization() {
  const payload = await getPayload({ config })

  const users = await payload.find({
    collection: 'users',
  })

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
  })

  const tree = CreateOrganizationsTree(allOrganizations)

  return (
    <div>
      <h1>Create Organization</h1>
      <Card>
        <CreateOrgForm users={users.docs} tree={tree} organizations={allOrganizations.docs} />
      </Card>
    </div>
  )
}
