import React from 'react'
import { CreateOrganizationForm } from '@/organizations'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/shared/components/ui/card'
import { getAuthUser } from '@/auth/utils/getAuthUser'

export default async function CreateOrganization() {
  const payload = await getPayload({ config })
  const {user} = await getAuthUser()

  const organizations = await payload.find({
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
    overrideAccess: false,
    user
  })

  const orgIds = organizations.docs.map((org) => org.id)

  const users = await payload.find({
    collection: 'users',
    where:{
      'organizations.id':{in: orgIds}
    },
    overrideAccess:false,
    user
  })

  return (
    <div>
      <h1>Create Organization</h1>
      <Card>
        <CreateOrganizationForm users={users.docs} organizations={organizations.docs} />
      </Card>
    </div>
  )
}
