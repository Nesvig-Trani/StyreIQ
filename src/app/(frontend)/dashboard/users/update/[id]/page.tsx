import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent } from '@/shared/components/ui/card'
import { UpdateUserForm } from '@/users'
import { getAuthUser } from '@/auth/utils/getAuthUser'

export default async function UpdateUser({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await getAuthUser()
  const payload = await getPayload({ config })
  const { id } = await params
  if (!id) return <div>404</div>

  const data = await payload.findByID({
    collection: 'users',
    id: id,
    depth: 0,
  })

  if (!data)
    return (
      <div>
        <h1>404</h1>
      </div>
    )

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
    user,
  })

  return (
    <div>
      <h1>Update user</h1>
      <Card>
        <CardContent>
          <UpdateUserForm organizations={organizations.docs} data={data} id={id} />
        </CardContent>
      </Card>
    </div>
  )
}
