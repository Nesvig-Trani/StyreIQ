import { LucideIcon } from 'lucide-react'
import React from 'react'

interface HeaderMetricCardProps {
  title: string
  value: number | string
  subtitle: string
  riskLevel?: string
  color?: 'blue' | 'yellow' | 'red' | 'green'
  icon: LucideIcon
}

export const HeaderMetricCard: React.FC<HeaderMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
}) => {
  const getIconBg = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-500'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-500'
      case 'red':
        return 'bg-red-100 text-red-500'
      case 'green':
        return 'bg-green-100 text-green-500'
      default:
        return 'bg-blue-100 text-blue-500'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-start py-6">
        <div className="flex-1 flex flex-col gap-1">
          <p className="text-sm text-gray-600 !m-0">{title}</p>
          <p className="text-2xl font-bold text-gray-900 !m-0">{value}</p>
          <p
            className="text-xs text-gray-500 
          !m-0"
          >
            {subtitle}
          </p>
        </div>

        <div
          className={`ml-3 flex items-center justify-center w-12 h-12 rounded-lg ${getIconBg(
            color,
          )}`}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}
