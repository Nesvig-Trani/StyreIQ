import { getUserById, UpdateUserForm } from '@/features/users'
import { checkUserUpdateAccess } from '@/shared'
import { getAccessibleOrganizationsForUser } from '@/shared'

import { ChevronRight, Home } from 'lucide-react'
import { Card, CardContent } from '@/shared'
import Link from 'next/link'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

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
  const effectiveRole = getEffectiveRoleFromUser(user)
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/dashboard" className="flex items-center hover:text-gray-700">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/users" className="hover:text-gray-700">
            Users
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Update</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Update User</h1>
          <p className="text-lg text-gray-600">
            Update the details a user account for your organization
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="max-w-4xl">
              <UpdateUserForm
                organizations={organizations}
                data={data}
                id={id}
                authUserRole={effectiveRole}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
