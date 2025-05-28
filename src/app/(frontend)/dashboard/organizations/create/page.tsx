import React from 'react'
import { CreateOrganizationForm } from '@/organizations'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/shared/components/ui/card'

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
    limit: 0,
  })

  return (
    <div>
      <h1>Create Organization</h1>
      <Card>
        <CreateOrganizationForm users={users.docs} organizations={allOrganizations.docs} />
      </Card>
    </div>
  )
}
