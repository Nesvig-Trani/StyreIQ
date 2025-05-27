import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { serverAuthNoUsersGuard } from '@/users/hooks/serverAuthNoUsersGuard'
import { CreateFirstUserForm } from '@/users/forms/create-first-user'

export default async function CreateFirstUserPage() {
  await serverAuthNoUsersGuard()

  return (
    <div className="mx-auto max-w-max">
      <h1>Create First User</h1>
      <Card>
        <CardContent>
          <CreateFirstUserForm />
        </CardContent>
      </Card>
    </div>
  )
}
