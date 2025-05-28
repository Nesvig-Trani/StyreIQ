import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent } from '@/shared/components/ui/card'
import { UpdateUserForm } from '@/users'

export default async function UpdateUser({ params }: { params: { id: string } }) {
  const payload = await getPayload({ config })
  if (!params.id) return <div>404</div>
  const user = await payload.findByID({
    collection: 'users',
    id: params.id,
    depth: 0,
  })

  if (!user) return <div>404</div>

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
      <h1>Update user</h1>
      <Card>
        <CardContent>
          <UpdateUserForm organizations={allOrganizations.docs} data={user} id={params.id} />
        </CardContent>
      </Card>
    </div>
  )
}
