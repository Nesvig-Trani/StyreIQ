import React from 'react'
import { Card } from '@/shared/components/ui/card'
import { CreateUserForm } from '@/users/'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getAllOrganizations } from '@/organizations/queries'

export default async function CreateUserPage() {
  const { user } = await getAuthUser()

  const organizations = await getAllOrganizations({ user })

  return (
    <div>
      <h1>Create User</h1>
      <Card>
        <CreateUserForm organizations={organizations.docs} user={user} />
      </Card>
    </div>
  )
}
