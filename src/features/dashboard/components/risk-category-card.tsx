import type { FC, MouseEventHandler } from 'react'
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
  onClick?: MouseEventHandler<HTMLButtonElement>
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

  const getIconBg = (colorKey: string) => {
    switch (colorKey) {
      case 'red':
        return 'bg-red-100'
      case 'orange':
        return 'bg-orange-100'
      case 'yellow':
        return 'bg-yellow-100'
      default:
        return 'bg-gray-100'
    }
  }

  const getIconColor = (colorKey: string) => {
    switch (colorKey) {
      case 'red':
        return 'text-red-600'
      case 'orange':
        return 'text-orange-600'
      case 'yellow':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const issueWord = issues === 1 ? 'issue' : 'issues'

  const baseCardClasses =
    'bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition w-full text-left'

  const body = (
    <>
      <div className="mb-3 flex items-start space-x-3">
        <div className={`shrink-0 rounded-lg p-2 ${getIconBg(color)}`} aria-hidden="true">
          <Icon size={20} className={getIconColor(color)} />
        </div>

        <dl className="m-0 min-w-0 flex-1 space-y-0">
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
                className={`h-2 w-2 shrink-0 rounded-full ${getSeverityColor(item.severity)}`}
                aria-hidden="true"
              />
              <span className="truncate text-sm text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open category — ${title}`}
        className={`${baseCardClasses} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
      >
        {body}
      </button>
    )
  }

  return <div className={`${baseCardClasses} cursor-default`}>{body}</div>
}
