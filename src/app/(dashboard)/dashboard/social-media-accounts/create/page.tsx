import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getAllUnits } from '@/features/units/plugins/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'
import { CreateSocialMediaForm } from '@/features/social-medias'
import { getUsersByRoles, UserRolesEnum } from '@/features/users'
import { redirect } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getServerTenantContext } from '@/app/(dashboard)/server-tenant-context'

export default async function CreateSocialMediaPage() {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)

  if (
    !(
      user &&
      user.role &&
      [UserRolesEnum.SuperAdmin, UserRolesEnum.UnitAdmin].includes(user.role as UserRolesEnum)
    )
  ) {
    redirect('/dashboard/social-media-accounts')
  }

  const users = await getUsersByRoles([
    UserRolesEnum.SuperAdmin,
    UserRolesEnum.UnitAdmin,
    UserRolesEnum.SocialMediaManager,
  ])

  const organizations = await getAllUnits()

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/dashboard" className="flex items-center hover:text-gray-700">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/social-media-accounts" className="hover:text-gray-700">
            Social Media
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Create Social Media Account</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Social Media Account</h1>
          <p className="text-lg text-gray-600">
            Register a new official social media account for your organization
          </p>
        </div>

        {/* Form Container */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="max-w-4xl">
              <CreateSocialMediaForm
                users={users.docs}
                organizations={organizations.docs}
                currentUser={user}
                selectedTenantId={tenantContext.tenantIdForFilter}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
