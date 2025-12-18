import React from 'react'
import Link from 'next/link'
import { CreateUserForm } from '@/features/users'
import { checkUserCreateAccess } from '@/shared'
import { getAccessibleOrganizationsForUser } from '@/shared'
import { ChevronRight, Home } from 'lucide-react'
import { Card, CardContent } from '@/shared'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getServerTenantContext } from '@/app/(dashboard)/server-tenant-context'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export default async function CreateUserPage() {
  const { user, accessDenied, component } = await checkUserCreateAccess()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)

  if (accessDenied) {
    return component
  }

  const organizations = await getAccessibleOrganizationsForUser(
    user,
    tenantContext.tenantIdForFilter,
  )
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
          <span className="text-gray-900 font-medium">Create </span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create User</h1>
          <p className="text-lg text-gray-600">Create a new user account for your organization</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="max-w-4xl">
              <CreateUserForm
                initialOrganizations={organizations}
                authUserRole={effectiveRole}
                selectedTenantId={tenantContext.tenantIdForFilter}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
