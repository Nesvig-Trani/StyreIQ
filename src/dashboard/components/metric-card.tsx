import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared'

const getRiskColor = (level: 'low' | 'medium' | 'high') => {
  switch (level) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200'
  }
}

const getBadgeVariant = (level: 'low' | 'medium' | 'high') => {
  switch (level) {
    case 'high':
      return 'destructive' as const
    case 'medium':
      return 'secondary' as const
    case 'low':
      return 'default' as const
  }
}

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  riskLevel,
  subtitle,
}: {
  title: string
  value: number | string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  riskLevel?: 'low' | 'medium' | 'high'
  subtitle?: string
}) => (
  <Card className={riskLevel ? getRiskColor(riskLevel) : 'border-gray-200'}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium leading-tight">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    </CardHeader>
    <CardContent>
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>}
      {riskLevel && riskLevel !== 'low' && (
        <Badge variant={getBadgeVariant(riskLevel)} className="mt-2 text-xs">
          {riskLevel === 'high' ? 'High Risk' : 'Medium Risk'}
        </Badge>
      )}
    </CardContent>
  </Card>
)
