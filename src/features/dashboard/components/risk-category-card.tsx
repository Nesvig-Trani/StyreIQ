import type { FC } from 'react'
import { LucideIcon } from 'lucide-react'

interface RiskItem {
  label: string
  severity: 'high' | 'medium' | 'low'
}

interface RiskCategoryCardProps {
  title: string
  subtitle: string
  issues: number
  color: 'red' | 'orange' | 'yellow' | 'gray'
  icon: LucideIcon
  items?: RiskItem[]
  onClick?: () => void
}

export const RiskCategoryCard: FC<RiskCategoryCardProps> = ({
  title,
  subtitle,
  issues,
  color,
  icon: Icon,
  items = [],
  onClick,
}) => {
  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-orange-500'
      case 'low':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getIconWrapper = (colorKey: string) => {
    switch (colorKey) {
      case 'red':
        return 'bg-red-100 text-red-600'
      case 'orange':
        return 'bg-orange-100 text-orange-600'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const issueWord = issues === 1 ? 'issue' : 'issues'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition"
    >
      <div className="flex items-start space-x-3 mb-3">
        <div className={`p-2 rounded-lg shrink-0 ${getIconWrapper(color)}`} aria-hidden="true">
          <Icon size={20} aria-hidden="true" />
        </div>

        <dl className="m-0 flex-1 min-w-0 space-y-0">
          <dt className="font-medium text-gray-900">{title}</dt>
          <dd className="m-0 space-y-3">
            <span className="block text-sm text-gray-600">{subtitle}</span>
            <span className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">{issues}</span>
              <span className="pl-1 text-sm text-gray-500">{issueWord}</span>
            </span>
          </dd>
        </dl>
      </div>

      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${getSeverityColor(item.severity)}`}
                aria-hidden="true"
              />
              <span className="text-sm text-gray-700 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
