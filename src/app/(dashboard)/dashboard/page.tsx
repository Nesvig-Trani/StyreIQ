import { getUsersInfoForDashboard } from '@/features/users/plugins/queries'
import { getFlagInfoForDashboard } from '@/features/flags/plugins/queries'
import {
  Users,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  XCircle,
  CheckCircle,
  ActivityIcon,
} from 'lucide-react'
import { Button } from '@/shared'
import Link from 'next/link'
import { HeaderMetricCard } from '@/features/dashboard/components/header-metric-card'

import { StatusCard } from '@/features/dashboard/components/status-card'
import { DashboardRiskSection } from '../../../features/dashboard/components/dashboard-client-wrapper'

const getRiskLevel = (value: number, thresholds: { low: number; medium: number }) => {
  if (value >= thresholds.medium) return 'high'
  if (value >= thresholds.low) return 'medium'
  return 'low'
}

export default async function DashboardPage() {
  const data = await getUsersInfoForDashboard()
  const flags = await getFlagInfoForDashboard()
  if (!data) {
    return <div className="text-center text-red-500">Failed to load dashboard data</div>
  }

  const securityRisk = getRiskLevel(flags.security.count, { low: 0, medium: 2 })
  const legalRisk = getRiskLevel(flags.legal.count, { low: 0, medium: 2 })
  const complianceRisk = getRiskLevel(flags.compliance.count, { low: 0, medium: 2 })
  const incidentRisk = getRiskLevel(flags.incident.count, { low: 0, medium: 2 })
  const activityRisk = getRiskLevel(flags.activity.count, { low: 0, medium: 2 })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 !m-0">Dashboard</h1>
            <p className="text-sm text-gray-600 !mt-2 !ml-1">
              Monitor social media governance and risk across your organization
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <Button variant="outline">
              <Link href={`/dashboard/social-media-accounts`}>View All Accounts</Link>
            </Button>
            <Button variant="default">
              <Link href={`/dashboard/social-media-accounts/create`}>Create Account</Link>
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto px-0 py-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <HeaderMetricCard
            title="Total Accounts"
            value={data.totalAccounts}
            subtitle="All social media accounts"
            icon={Users}
          />

          <HeaderMetricCard
            title="Active Issues"
            value={
              flags.security.count +
              flags.legal.count +
              flags.compliance.count +
              flags.incident.count +
              flags.activity.count
            }
            subtitle="Requiring attention"
            icon={AlertTriangle}
            color="yellow"
          />

          <HeaderMetricCard
            title="High Risk Issues"
            value={
              (securityRisk === 'high' ? 1 : 0) +
              (legalRisk === 'high' ? 1 : 0) +
              (complianceRisk === 'high' ? 1 : 0) +
              (incidentRisk === 'high' ? 1 : 0) +
              (activityRisk === 'high' ? 1 : 0)
            }
            subtitle="Require immediate attention"
            icon={ShieldAlert}
            color="red"
          />

          <HeaderMetricCard
            title="Active Users"
            value={data.activeUsers.unitAdmins + data.activeUsers.socialMediaManagers}
            subtitle="Unit admins and managers"
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
