import { getUserById, UpdateUserForm } from '@/features/users'
import { getAllUnits } from '@/features/units/plugins/queries'
import { checkUserUpdateAccess } from '@/shared'
import { buildAccessibleUnitFilter } from '@/features/units/plugins/utils'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { UserRolesEnum } from '@/features/users'
import { Organization } from '@/types/payload-types'

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

  let organizations: Organization[] = []

  if (user?.role === UserRolesEnum.SuperAdmin) {
    const allUnits = await getAllUnits()
    organizations = allUnits.docs
  } else {
    const { payload } = await getPayloadContext()
    const userOrgs = user?.organizations as Organization[]

    if (userOrgs && userOrgs.length > 0) {
      const whereOrg = buildAccessibleUnitFilter({ orgs: userOrgs })
      const accessibleUnits = await payload.find({
        collection: 'organization',
        where: whereOrg,
        limit: 0,
      })
      organizations = accessibleUnits.docs
    }
  }

  return (
    <div>
      <UpdateUserForm organizations={organizations} data={data} id={id} />
    </div>
  )
}
