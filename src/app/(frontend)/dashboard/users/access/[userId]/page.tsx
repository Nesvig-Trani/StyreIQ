import { getPayload } from 'payload'
import React from 'react'
import config from '@payload-config'
import { OrganizationAccessForm } from '@/shared'

async function UserAccessPage({ params }: { params: Promise<{ userId: string }> }) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { userId } = await params
  const user = await payload.findByID({
    collection: 'users',
    id: userId 
  }) 
  const userOrgs = await payload.find({
    collection: 'organization_access',
    where: {
      "user.id": {
        equals: userId,
      },
    },
  })
  
  return (
    <div>
      <h1>Set organization access</h1>
      <p>{user.name} - {user.email}</p>
      <OrganizationAccessForm initialAccess={userOrgs.docs} />
    </div>
  )
}

export default UserAccessPage
