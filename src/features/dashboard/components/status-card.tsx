import { LucideIcon } from 'lucide-react'
import React from 'react'

interface StatusCardProps {
  title: string
  value: number
  subtitle: string
  color?: 'green' | 'red' | 'blue'
  icon: LucideIcon
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  color = 'blue',
  icon: Icon,
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          iconBg: 'bg-green-50',
          iconColor: 'text-green-500',
        }
      case 'red':
        return {
          iconBg: 'bg-red-50',
          iconColor: 'text-red-500',
        }
      case 'blue':
        return {
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-500',
        }
      default:
        return {
          iconBg: 'bg-gray-50',
          iconColor: 'text-gray-500',
        }
    }
  }

  const colors = getColorClasses(color)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex items-center space-x-3">
      <div className={`p-3 rounded-lg ${colors.iconBg}`}>
        <Icon className={`w-6 h-6 ${colors.iconColor}`} />
      </div>

      <div className="py-6">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 !m-0">{value}</p>
        <p className="text-sm text-gray-500 !m-0">{subtitle}</p>
      </div>
    </div>
  )
}
