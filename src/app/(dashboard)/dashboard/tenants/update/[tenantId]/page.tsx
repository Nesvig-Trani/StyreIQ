import React from 'react'
import { Card, CardContent } from '@/shared'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { getTenantById } from '@/features/tenants/plugins/queries'
import { UpdateTenantForm } from '@/features/tenants/forms/update-tenant'

export default async function UpdateTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  if (!tenantId) return <div>404</div>

  const data = await getTenantById({ id: Number(tenantId) })
  if (!data) {
    return (
      <div>
        <h1>404</h1>
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
          <Link href="/dashboard/tenants" className="hover:text-gray-700">
            Tenants
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Update Tenant</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Governance Settings</h1>
          <p className="text-lg text-gray-600">
            Configure when compliance tasks are created, when assignees are reminded, and what
            happens when tasks become overdue.
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="max-w-4xl">
              <UpdateTenantForm tenant={data} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
