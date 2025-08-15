import { UpdateSocialMediaForm } from '@/features/social-medias/forms/update-social-media'
import { getUsersByRoles, UserRolesEnum } from '@/features/users'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getSocialMediaById } from '@/features/social-medias/plugins/queries'
import { getAllUnits } from '@/features/units/plugins/queries'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

export default async function UpdateSocialMediaPage({
  params,
}: {
  params: Promise<{ socialMediaId: string }>
}) {
  const { socialMediaId } = await params
  if (!socialMediaId) return <div>404</div>

  const data = await getSocialMediaById({ id: Number(socialMediaId) })
  if (!data) {
    return (
      <div>
        <h1>404</h1>
      </div>
    )
  }
  const { user } = await getAuthUser()

  const users = await getUsersByRoles([UserRolesEnum.SuperAdmin, UserRolesEnum.UnitAdmin])

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
          <span className="text-gray-900 font-medium">Update Social Media Account</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Update Social Media Account</h1>
          <p className="text-lg text-gray-600">Modify the details of your social media account</p>
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
              <UpdateSocialMediaForm
                data={data}
                users={users.docs}
                organizations={organizations.docs}
                user={user}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
