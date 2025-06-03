import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/shared/components/ui/card'
import { CreateUserForm } from '@/users/'
import { getAuthUser } from '@/auth/utils/getAuthUser'

export default async function CreateUserPage() {
  const payload = await getPayload({ config })

  const { user } = await getAuthUser()

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
    user,
    overrideAccess: false
  })

  return (
    <div>
      <h1>Create User</h1>
      <Card>
        <CreateUserForm organizations={organizations.docs} user={user} />
      </Card>
    </div>
  )
}
