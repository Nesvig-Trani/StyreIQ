import { getUserById, UpdateUserForm } from '@/features/users'
import { getAllOrganizations } from '@/features/organizations/plugins/queries'

export default async function UpdateUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return <div>404</div>

  const data = await getUserById({ id: Number(id) })
  if (!data)
    return (
      <div>
        <h1>404</h1>
      </div>
    )

  const organizations = await getAllOrganizations()

  return (
    <div>
      <UpdateUserForm organizations={organizations.docs} data={data} id={id} />
    </div>
  )
}
