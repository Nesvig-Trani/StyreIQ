import React from 'react'

import { Calendar, LucideIcon, Mail, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog'

interface User {
  id: number
  name: string
  email: string
}

interface Issue {
  id: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  dueDate: string
  assignedTo?: string
  affectedAccount?: string
  user?: User
}

interface RiskDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  issues: Issue[]
  icon: LucideIcon
  color: 'red' | 'yellow' | 'orange' | 'gray'
}

export const RiskDetailsModal: React.FC<RiskDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  issues,
  icon: Icon,
  color,
}) => {
  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-gray-400'
      default:
        return 'border-l-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    })
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-full max-h-[80vh] p-0 m-4 overflow-hidden">
        <div className="overflow-y-auto max-h-[80vh] p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-lg ${getIconWrapper(color)}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-gray-900 truncate">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 truncate !m-0 !mt-1">
                {subtitle}
              </DialogDescription>
            </div>
          </div>

          {issues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base font-medium text-gray-900 mb-1">No issues found</p>
              <p className="text-sm text-gray-500">
                There are currently no {title.toLowerCase()} requiring attention.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`bg-white rounded-lg border border-gray-100 ${getSeverityBorderColor(issue.severity)} border-l-4 p-4 shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-medium text-gray-900 leading-tight flex-1 pr-2">
                      {issue.title}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-400 flex-shrink-0">
                      <Calendar size={12} />
                      <span>{formatDate(issue.dueDate)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{issue.description}</p>

                  {issue.user && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2 text-sm min-w-0">
                        <User size={14} className="text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate">
                          {issue.user.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm mt-1 min-w-0">
                        <Mail size={14} className="text-gray-500 flex-shrink-0" />
                        <span className="text-gray-600 truncate" title={issue.user.email}>
                          {issue.user.email}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
