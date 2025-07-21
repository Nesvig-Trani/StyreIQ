import { MetricCard } from '@/dashboard/components/metric-card'
import { getUsersInfoForDashboard } from '@/plugins/users/queries'
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  Shield,
  Activity,
  Pause,
  ArrowUpDown,
  ClipboardList,
  FileWarning,
  ActivityIcon,
  ShieldAlert,
  ScaleIcon,
} from 'lucide-react'
import { getFlagInfoForDashboard } from '@/plugins/flags/queries'

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
  const pendingRisk = getRiskLevel(data.pendingApproval, { low: 5, medium: 10 })
  const unassignedRisk = getRiskLevel(data.unassignedAccounts, { low: 3, medium: 6 })
  const inactiveRisk = getRiskLevel(data.accountsByStatus.inactive, { low: 10, medium: 20 })

  const securityRisk = getRiskLevel(flags.security, { low: 0, medium: 2 })
  const legalRisk = getRiskLevel(flags.legal, { low: 0, medium: 2 })
  const complianceRisk = getRiskLevel(flags.compliance, { low: 0, medium: 2 })
  const incidentRisk = getRiskLevel(flags.incident, { low: 0, medium: 2 })
  const activityRisk = getRiskLevel(flags.activity, { low: 0, medium: 2 })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Social Media Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile Title */}
        <div className="lg:hidden mb-6">
          <h1 className="text-xl font-bold text-gray-900">Social Media Dashboard</h1>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Accounts */}
          <MetricCard
            title="Total Accounts"
            value={data.totalAccounts}
            icon={Users}
            subtitle="All social media accounts"
          />

          {/* Pending Approval */}
          <MetricCard
            title="Pending Approval"
            value={data.pendingApproval}
            icon={Clock}
            riskLevel={pendingRisk}
            subtitle="Awaiting review"
          />

          {/* Unassigned Accounts */}
          <MetricCard
            title="Unassigned Accounts"
            value={data.unassignedAccounts}
            icon={AlertTriangle}
            riskLevel={unassignedRisk}
            subtitle="No administrator assigned"
          />

          {/* Total Active Users */}
          <MetricCard
            title="Active Users"
            value={data.activeUsers.unitAdmins + data.activeUsers.socialMediaManagers}
            icon={UserCheck}
            subtitle={`${data.activeUsers.unitAdmins} admins, ${data.activeUsers.socialMediaManagers} managers`}
          />
        </div>

        {/* Account Status Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title="Active Accounts"
            value={data.accountsByStatus.active}
            icon={Activity}
            subtitle="Currently operational"
          />

          <MetricCard
            title="Inactive Accounts"
            value={data.accountsByStatus.inactive}
            icon={Pause}
            riskLevel={inactiveRisk}
            subtitle="Not currently active"
          />

          <MetricCard
            title="In Transition"
            value={data.accountsByStatus.inTransition}
            icon={ArrowUpDown}
            subtitle="Status being updated"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Security Risks"
            value={flags.security}
            icon={ShieldAlert}
            subtitle="Missing 2FA, outdated password"
            riskLevel={securityRisk}
          />
          <MetricCard
            title="Legal Risks"
            value={flags.legal}
            icon={ScaleIcon}
            riskLevel={legalRisk}
            subtitle="FOIA/HIPAA/FERPA not confirmed or incomplete"
          />
          <MetricCard
            title="Activity Risks"
            value={flags.activity}
            icon={ActivityIcon}
            riskLevel={activityRisk}
            subtitle="Inactive accounts, no assigned owner"
          />
          <MetricCard
            title="Incident Reports"
            value={flags.incident}
            icon={FileWarning}
            riskLevel={incidentRisk}
            subtitle="Open incident reports"
          />
          <MetricCard
            title="Compliance Risks"
            value={flags.compliance}
            icon={ClipboardList}
            riskLevel={complianceRisk}
            subtitle="Incomplete training, unacknowledged policies"
          />
        </div>

        {/* User Role Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <MetricCard
            title="Unit Administrators"
            value={data.activeUsers.unitAdmins}
            icon={Shield}
            subtitle="Administrative users"
          />

          <MetricCard
            title="Social Media Managers"
            value={data.activeUsers.socialMediaManagers}
            icon={Users}
            subtitle="Content management users"
          />
        </div>
      </main>
    </div>
  )
}
