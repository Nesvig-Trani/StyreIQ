import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/shared/components/ui/card'
import { CreateUserForm } from '@/users/'

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

  return (
    <div>
      <h1>Create User</h1>
      <Card>
        <CreateUserForm organizations={allOrganizations.docs} />
      </Card>
    </div>
  )
}
