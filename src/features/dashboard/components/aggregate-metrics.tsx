'use client'
import { useAggregateMetrics } from '@/features/tenants/hooks/use-aggregate-metrics'
import { Building2, Users, ClipboardCheck, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { HeaderMetricCard } from './header-metric-card'

export function AggregateMetricsView() {
  const { data, isLoading, error } = useAggregateMetrics()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
          <CardTitle className="text-red-600">Error Loading Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  const { totalTenants, aggregateMetrics } = data

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      <HeaderMetricCard
        title="Active Tenants"
        value={totalTenants}
        icon={Building2}
        subtitle="Organizations using the platform"
      />

      <HeaderMetricCard
        title="Total Users"
        value={aggregateMetrics.totalUsers}
        icon={Users}
        subtitle="Across all tenants"
      />

      <HeaderMetricCard
        title="Total Compliance Tasks:"
        value={aggregateMetrics.totalTasks}
        icon={ClipboardCheck}
        subtitle={`${aggregateMetrics.totalCompletedTasks} completed`}
      />

      <HeaderMetricCard
        title="Avg. Completion Rate"
        value={`${aggregateMetrics.averageCompletionRate}%`}
        icon={TrendingUp}
        subtitle="Average across all tenants"
      />
    </div>
  )
}
