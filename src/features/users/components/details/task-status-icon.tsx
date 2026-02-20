import React from 'react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import type { ComplianceTask } from '@/types/payload-types'

interface TaskStatusResult {
  label: string
  color: string
  icon: typeof XCircle
}

export const getTaskStatus = (task?: ComplianceTask): TaskStatusResult => {
  if (!task) {
    return {
      label: 'Not Assigned',
      color: 'text-gray-600',
      icon: XCircle,
    }
  }

  if (task.status === 'COMPLETED') {
    return {
      label: 'Completed',
      color: 'text-green-700',
      icon: CheckCircle,
    }
  }

  if (task.status === 'OVERDUE') {
    return {
      label: 'Overdue',
      color: 'text-red-700',
      icon: XCircle,
    }
  }

  return {
    label: 'Pending',
    color: 'text-orange-700',
    icon: Clock,
  }
}

interface TaskStatusIconProps {
  task?: ComplianceTask
}

export const TaskStatusIcon: React.FC<TaskStatusIconProps> = ({ task }) => {
  const status = getTaskStatus(task)

  return (
    <span className="flex items-center gap-1">
      <status.icon className={`h-4 w-4 ${status.color}`} />
      <span className={`text-sm ${status.color}`}>{status.label}</span>
    </span>
  )
}
