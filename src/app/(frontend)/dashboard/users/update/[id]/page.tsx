import { Card, CardContent } from '@/shared/components/ui/card'
import { getUserById, UpdateUserForm } from '@/users'
import { getAuthUser } from '@/auth/utils/getAuthUser'
import { getAllOrganizations } from '@/organizations/queries'

export default async function UpdateUser({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await getAuthUser()
  const { id } = await params
  if (!id) return <div>404</div>

  const data = await getUserById({ id: Number(id) })
  if (!data)
    return (
      <div>
        <h1>404</h1>
      </div>
    )

  const organizations = await getAllOrganizations({ user })

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
