import * as React from 'react'

import { Badge, Card, CardContent } from '@/shared'

type RiskLevel = 'low' | 'medium' | 'high'

const RISK_BADGE_LABELS: Partial<Record<RiskLevel, string>> = {
  high: 'High Risk',
  medium: 'Medium Risk',
}

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200'
  }
}

const getBadgeVariant = (level: RiskLevel) => {
  switch (level) {
    case 'high':
      return 'destructive' as const
    case 'medium':
      return 'secondary' as const
    case 'low':
      return 'default' as const
  }
}

const getMetricAriaLabel = ({
  value,
  subtitle,
  riskBadgeText,
}: {
  value: number | string
  subtitle?: string
  riskBadgeText?: string
}) => {
  const labelParts = [String(value), subtitle, riskBadgeText].filter(Boolean)

  return labelParts.length > 1 ? labelParts.join(', ') : undefined
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
  riskLevel?: RiskLevel
  subtitle?: string
}) => {
  const riskBadgeText = riskLevel ? RISK_BADGE_LABELS[riskLevel] : undefined
  const ddAriaLabel = getMetricAriaLabel({ value, subtitle, riskBadgeText })

  return (
    <Card className={riskLevel ? getRiskColor(riskLevel) : 'border-gray-200'}>
      <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
        <div className="flex flex-row items-start justify-between">
          <dl className="m-0 space-y-0 flex-1">
            <div>
              <dt className="text-sm font-medium leading-tight pb-2">{title}</dt>
              <dd className="m-0" aria-label={ddAriaLabel}>
                <span
                  className="block text-xl sm:text-2xl font-bold"
                  aria-hidden={!!ddAriaLabel || undefined}
                >
                  {value}
                </span>
                {subtitle ? (
                  <span
                    className="block text-xs text-muted-foreground mt-1 line-clamp-2"
                    aria-hidden={!!ddAriaLabel || undefined}
                  >
                    {subtitle}
                  </span>
                ) : null}
                {riskLevel && riskBadgeText ? (
                  <span className="mt-2 inline-block" aria-hidden={!!ddAriaLabel || undefined}>
                    <Badge variant={getBadgeVariant(riskLevel)} className="text-xs">
                      {riskBadgeText}
                    </Badge>
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
          <Icon className="h-4 w-4 text-muted-foreground shrink-0 ml-3 mt-0.5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}
