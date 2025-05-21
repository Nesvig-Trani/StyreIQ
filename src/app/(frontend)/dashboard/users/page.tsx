import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent } from '@/components/ui/card'
import { UsersTable } from '@/components/users/usersTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function UsersPage() {
  const payload = await getPayload({ config })
  const users = await payload.find({
    collection: 'users',
    depth: 1,
  })
  return (
    <div>
      <Card>
        <div className={'flex justify-end'}>
          <Button>
            <Link href={'/dashboard/users/create'}>Create User</Link>
          </Button>
        </div>
        <CardContent>
          <UsersTable data={users.docs} />
        </CardContent>
      </Card>
    </div>
  )
}
