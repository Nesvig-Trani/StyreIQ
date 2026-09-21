'use server'
import React from 'react'
import { CreateUnitForm } from '@/features/units'
import { getAllUsers } from '@/features/users'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'

import { getAllUnits } from '@/features/units/plugins/queries'
import { Button } from '@/shared/components/ui/button'
import { ensureStyreIQOrganization } from '@/features/units'
import { AccessControl } from '@/shared/utils/rbac'
import { ChevronRight, Home, AlertCircle } from 'lucide-react'
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
        <h1 className="text-2xl font-bold mb-2">Create unit</h1>
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

  if (organizations.docs.length === 0 && access.can('create', 'UNITS')) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/dashboard" className="flex items-center hover:text-gray-700">
              <Home className="h-4 w-4 mr-1" aria-hidden="true" />
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link href="/dashboard/units" className="hover:text-gray-700">
              Units
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="text-gray-900 font-medium">Create Unit</span>
          </nav>

          <Card className="shadow-lg border-0">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="rounded-full bg-yellow-100 p-4">
                  <AlertCircle className="h-12 w-12 text-yellow-600" aria-hidden="true" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-2xl font-bold text-gray-900">No Parent Unit Available</h1>
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
            <Home className="h-4 w-4 mr-1" aria-hidden="true" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <Link href="/dashboard/units" className="hover:text-gray-700">
            Units
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
