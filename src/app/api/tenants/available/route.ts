import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { UserRolesEnum } from '@/features/users'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const { user } = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const effectiveRole = getEffectiveRoleFromUser(user)
    const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin

    if (!isSuperAdmin) {
      return NextResponse.json({ tenants: [] })
    }

    const tenantsResult = await payload.find({
      collection: 'tenants',
      where: {
        status: { equals: 'active' },
      },
      limit: 0,
      sort: 'name',
    })

    return NextResponse.json({ tenants: tenantsResult.docs })
  } catch (error) {
    console.error('Error fetching available tenants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
