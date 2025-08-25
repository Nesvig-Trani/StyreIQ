import { LucideIcon } from 'lucide-react'

interface RiskCategoryCardProps {
  title: string
  subtitle: string
  issues: number
  color: 'red' | 'orange' | 'yellow' | 'gray'
  icon: LucideIcon
  items?: string[]
  onClick?: () => void
}

interface RiskCategoryCardProps {
  title: string
  subtitle: string
  issues: number
  color: 'red' | 'orange' | 'yellow' | 'gray'
  icon: LucideIcon
  items?: string[]
  onClick?: () => void
}

export const RiskCategoryCard: React.FC<RiskCategoryCardProps> = ({
  title,
  subtitle,
  issues,
  color,
  icon: Icon,
  items = [],
  onClick,
}) => {
  const getDotColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500'
      case 'orange':
        return 'bg-orange-500'
      case 'yellow':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getIconWrapper = (color: string) => {
    switch (color) {
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition"
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${getIconWrapper(color)}`}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 !m-0">{title}</h3>
          <p className="text-sm text-gray-600 !m-0">{subtitle}</p>
        </div>
      </div>

      <div className="mb-0 flex items-baseline">
        <p className="text-2xl font-bold text-gray-900">{issues}</p>
        <p className="pl-1 text-sm text-gray-500">{issues === 1 ? 'issue' : 'issues'}</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getDotColor(color)}`}></div>
              <span className="text-sm text-gray-700 truncate">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
