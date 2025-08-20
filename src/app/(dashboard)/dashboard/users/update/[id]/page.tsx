import { getUserById, UpdateUserForm } from '@/features/users'
import { checkUserUpdateAccess } from '@/shared'
import { getAccessibleOrganizationsForUser } from '@/shared'

export default async function UpdateUser({ params }: { params: Promise<{ id: string }> }) {
  const { user, accessDenied, component } = await checkUserUpdateAccess()

  if (accessDenied) {
    return component
  }

  const { id } = await params
  if (!id) return <div>404</div>

  const data = await getUserById({ id: Number(id) })
  if (!data)
    return (
      <div>
        <h1>404</h1>
      </div>
    )

  const organizations = await getAccessibleOrganizationsForUser(user)

  return (
    <div>
      <UpdateUserForm organizations={organizations} data={data} id={id} />
    </div>
  )
}
