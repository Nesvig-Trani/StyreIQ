'use server'
import React from 'react'
import { CreateUnitForm } from '@/features/units'
import { getAllUsers } from '@/features/users'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'

import { getAllUnits } from '@/features/units/plugins/queries'
import { Button } from '@/shared/components/ui/button'
import { ensureStyreIQOrganization } from '@/features/units'
import { AccessControl } from '@/shared/utils/rbac'
import { ChevronRight, Home, UserPlus, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent } from '@/shared'
import Link from 'next/link'
import { getServerTenantContext } from '@/app/(dashboard)/server-tenant-context'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export default async function CreateUnit() {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">
          You must be logged in to view this page.
        </p>
      </div>
    )
  }

  const access = new AccessControl(user)

  const effectiveRole = getEffectiveRoleFromUser(user)
  // Ensure StyreIQ organization exists
  await ensureStyreIQOrganization()

  const organizations = await getAllUnits()
  const users = await getAllUsers()

  if (users.docs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/dashboard" className="flex items-center hover:text-gray-700">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/dashboard/units" className="hover:text-gray-700">
              Units
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Create Unit</span>
          </nav>

          <Card className="shadow-lg border-0">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="rounded-full bg-blue-100 p-4">
                  <UserPlus className="h-12 w-12 text-blue-600" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900">Create a Unit Admin First</h2>
                  <p className="text-lg text-gray-600 max-w-xl">
                    Before creating a unit, you need to create at least one user who will serve as
                    the Unit Admin.
                  </p>
                </div>

                <Card className="max-w-2xl bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-left space-y-2">
                        <h3 className="font-semibold text-blue-900">Why is this required?</h3>
                        <p className="text-sm text-blue-800">
                          Every unit must have an assigned administrator who will be responsible for
                          managing the unit, its social media accounts, and team members. This
                          ensures proper governance and accountability from day one.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/dashboard/users/create">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/dashboard/units">Back to Units</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (organizations.docs.length === 0 && access.can('create', 'UNITS')) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/dashboard" className="flex items-center hover:text-gray-700">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/dashboard/units" className="hover:text-gray-700">
              Units
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Create Unit</span>
          </nav>

          <Card className="shadow-lg border-0">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="rounded-full bg-yellow-100 p-4">
                  <AlertCircle className="h-12 w-12 text-yellow-600" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900">No Parent Unit Available</h2>
                  <p className="text-lg text-gray-600 max-w-xl">
                    You need a parent unit before creating a new unit. Please contact your Super
                    Admin to request one.
                  </p>
                </div>

                <Button variant="outline" size="lg" asChild>
                  <Link href="/dashboard/units">Back to Units</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/dashboard" className="flex items-center hover:text-gray-700">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/units" className="hover:text-gray-700">
            Units
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Create Unit</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Unit</h1>
          <p className="text-lg text-gray-600">Create a new unit in the system</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="max-w-4xl">
              <CreateUnitForm
                userRole={effectiveRole}
                users={users.docs}
                organizations={organizations.docs}
                selectedTenantId={tenantContext.tenantIdForFilter}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
