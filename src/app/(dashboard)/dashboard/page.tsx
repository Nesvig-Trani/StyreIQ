import { serverAuthGuard } from '@/features/auth/hooks/serverAuthGuard'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { UserRolesEnum } from '@/features/users'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'

import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import Link from 'next/link'
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  XCircle,
  Building2,
  Globe,
} from 'lucide-react'
import { ActivityIcon } from 'lucide-react'

import { getUsersInfoForDashboard } from '@/features/users/plugins/queries'
import { getFlagInfoForDashboard } from '@/features/flags/plugins/queries'
import { getSocialMediaAccountsCount } from '@/features/social-medias/plugins/queries'

import { AggregateMetricsView } from '@/features/dashboard/components/aggregate-metrics'
import { CentralAdminDashboard } from '@/features/dashboard/components/central-admin-dashboard'
import { HeaderMetricCard } from '@/features/dashboard/components/header-metric-card'
import { StatusCard } from '@/features/dashboard/components/status-card'
import { DashboardRiskSection } from '@/features/dashboard/components/dashboard-client-wrapper'
import { getServerTenantContext } from '../server-tenant-context'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const getRiskLevel = (value: number, thresholds: { low: number; medium: number }) => {
  if (value >= thresholds.medium) return 'high'
  if (value >= thresholds.low) return 'medium'
  return 'low'
}

export default async function DashboardPage() {
  await serverAuthGuard()
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()

  const tenantContext = await getServerTenantContext(user, payload)
  const { selectedTenant, isViewingAllTenants } = tenantContext

  const effectiveRole = getEffectiveRoleFromUser(user)

  const tenant = user && typeof user.tenant === 'object' ? user.tenant : null
  const tenantId = tenant?.id || (user && (user.tenant as number))

  const data = await getUsersInfoForDashboard()
  const flags = await getFlagInfoForDashboard()
  const socialMediaAccounts = await getSocialMediaAccountsCount()

  if (!data) {
    return <div className="text-center text-red-500">Failed to load dashboard data</div>
  }

  const accessManagementRisk = getRiskLevel(flags.accessManagement.count, { low: 0, medium: 2 })
  const securityRisk = getRiskLevel(flags.security.count, { low: 0, medium: 2 })
  const policiesTrainingRisk = getRiskLevel(flags.policiesTraining.count, { low: 0, medium: 2 })
  const flaggedIssuesRisk = getRiskLevel(flags.flaggedIssues.count, { low: 0, medium: 2 })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 !m-0">Dashboard</h1>

              {user && effectiveRole === UserRolesEnum.SuperAdmin && (
                <>
                  {isViewingAllTenants ? (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      <Globe className="h-3 w-3 mr-1" />
                      All Tenants
                    </Badge>
                  ) : selectedTenant ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Building2 className="h-3 w-3 mr-1" />
                      {selectedTenant.name}
                    </Badge>
                  ) : null}
                </>
              )}
            </div>

            <p className="text-sm text-gray-600 !mt-2 !ml-1">
              Monitor social media governance and risk across your organization
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <Button variant="outline">
              <Link href={`/dashboard/social-media-accounts`}>View All Accounts</Link>
            </Button>
            {!isViewingAllTenants && (
              <Button variant="default">
                <Link href={`/dashboard/social-media-accounts/create`}>Create Account</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto px-0 py-0">
        {user && effectiveRole === UserRolesEnum.SuperAdmin && isViewingAllTenants && (
          <AggregateMetricsView />
        )}
        {user && effectiveRole === UserRolesEnum.CentralAdmin && user.tenant && (
          <CentralAdminDashboard tenantId={tenantId} />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <HeaderMetricCard
            title="Total Accounts"
            value={socialMediaAccounts}
            subtitle="All social media accounts"
            icon={Users}
          />

          <HeaderMetricCard
            title="Active Issues"
            value={
              flags.accessManagement.count +
              flags.security.count +
              flags.policiesTraining.count +
              flags.flaggedIssues.count
            }
            subtitle="Requiring attention"
            icon={AlertTriangle}
            color="yellow"
          />

          <HeaderMetricCard
            title="High Risk Issues"
            value={
              (accessManagementRisk === 'high' ? 1 : 0) +
              (securityRisk === 'high' ? 1 : 0) +
              (policiesTrainingRisk === 'high' ? 1 : 0) +
              (flaggedIssuesRisk === 'high' ? 1 : 0)
            }
            subtitle="Require immediate attention"
            icon={ShieldAlert}
            color="red"
          />

          <HeaderMetricCard
            title="Active Users"
            value={
              data.activeUsers.superAdmin +
              data.activeUsers.unitAdmins +
              data.activeUsers.socialMediaManagers
            }
            subtitle="Admins and managers"
            icon={UserCheck}
            color="green"
          />
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Risk Categories</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">
                <Link href={`/dashboard/audit-logs`}>View Audit Log</Link>
              </Button>
            </div>
          </div>

          <DashboardRiskSection flags={flags} />
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Status Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <StatusCard
              title="Active Accounts"
              value={data.accountsByStatus.active}
              subtitle="Currently operational"
              color="green"
              icon={CheckCircle}
            />

            <StatusCard
              title="Accounts Needing Review"
              value={data.pendingApproval}
              subtitle="Require attention"
              color="red"
              icon={XCircle}
            />

            <StatusCard
              title="In Transition"
              value={data.accountsByStatus.inTransition}
              subtitle="Status being updated"
              color="blue"
              icon={ActivityIcon}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
