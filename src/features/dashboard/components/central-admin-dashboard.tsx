'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Users, Building2, ClipboardCheck } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useTenantMetrics } from '@/features/tenants/hooks/use-tenant-metrics'
import { HeaderMetricCard } from './header-metric-card'

interface CentralAdminDashboardProps {
  tenantId: number | null
}

export function CentralAdminDashboard({ tenantId }: CentralAdminDashboardProps) {
  const { data, isLoading, error } = useTenantMetrics(tenantId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <HeaderMetricCard
          title="Total Users"
          value={data.totalUsers}
          icon={Users}
          subtitle="Across all units"
        />

        <HeaderMetricCard
          title="Total Units"
          value={data.totalUnits}
          icon={Building2}
          subtitle="Departments & sub-units"
        />

        <HeaderMetricCard
          title="Compliance Rate"
          value={`${data.completionRate}%`}
          icon={ClipboardCheck}
          subtitle={`${data.completedTasks} of ${data.totalTasks} tasks completed`}
        />
      </div>
    </div>
  )
}
