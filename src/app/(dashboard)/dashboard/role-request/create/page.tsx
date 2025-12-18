import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { serverAuthGuard } from '@/features/auth/hooks/serverAuthGuard'
import { Card, CardContent, getAccessibleOrganizationsForUser } from '@/shared'
import { normalizeRoles } from '@/shared/utils/role-hierarchy'
import { UserRolesEnum } from '@/features/users'
import CreateRoleRequestForm from '@/features/role-request/forms/create-role-request-form'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getServerTenantContext } from '@/app/(dashboard)/server-tenant-context'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

export default async function CreateRoleRequestPage() {
  await serverAuthGuard()
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)
  const userRoles = normalizeRoles(user!.roles)
  const allRequestableRoles = [
    UserRolesEnum.CentralAdmin,
    UserRolesEnum.UnitAdmin,
    UserRolesEnum.SocialMediaManager,
  ]
  const availableRoles = allRequestableRoles.filter((role) => !userRoles.includes(role))

  const organizations = await getAccessibleOrganizationsForUser(
    user,
    tenantContext.tenantIdForFilter,
  )
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/dashboard" className="flex items-center hover:text-gray-700">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/role-request" className="hover:text-gray-700">
            Role Requests
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Create Role Request</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Role Request</h1>
        </div>
        <Card>
          <CardContent>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Request Additional Role</h2>
              <p className="text-sm text-gray-600">
                Request an additional role for a specific organization
              </p>
            </div>

            {availableRoles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-2">You already have all available roles</p>
                <p className="text-sm text-gray-500">
                  Current roles: {userRoles.map((r) => r.replace('_', ' ')).join(', ')}
                </p>
              </div>
            ) : (
              <CreateRoleRequestForm currentUser={user!} organizations={organizations} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
