import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { serverAuthNoUsersGuard } from '@/features/users/hooks/serverAuthNoUsersGuard'
import { CreateFirstUserForm } from '@/features/users/forms/create-first-user'

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
