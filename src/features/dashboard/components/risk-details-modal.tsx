import React from 'react'

import { AlertTriangle, Calendar, LucideIcon, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared'

interface Issue {
  id: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  dueDate: string
  assignedTo?: string
  affectedAccount?: string
}

interface RiskDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  issues: Issue[]
  totalIssues: number
  icon: LucideIcon
  color: 'red' | 'yellow' | 'orange' | 'gray'
}

export const RiskDetailsModal: React.FC<RiskDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  issues,
  totalIssues,
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
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-gray-900 truncate">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 truncate !m-0 !mt-1">
                {subtitle}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 mt-6">
            <span className="text-base font-semibold text-gray-900">
              {totalIssues} Issues Found
            </span>
            <div className="flex space-x-2">
              <Button variant="outline">Export Report</Button>
              <Button variant="default">Bulk Actions</Button>
            </div>
          </div>

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

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Calendar size={12} />
                    <span>Due Date:</span>
                    <span>• {formatDate(issue.dueDate)}</span>
                  </div>

                  {issue.assignedTo && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <User size={12} />
                      <span>Assigned To:</span>
                      <span>• {issue.assignedTo}</span>
                    </div>
                  )}

                  {issue.affectedAccount && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <div className="w-3 h-3 bg-gray-400 rounded-sm flex-shrink-0"></div>
                      <span>Affected Account:</span>
                      <span>• {issue.affectedAccount}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline">Assign</Button>
                  <Button variant="outline">
                    <AlertTriangle size={12} />
                    <span>Escalate</span>
                  </Button>
                  <Button variant="outline">Mark Resolved</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
