import React, { RefObject } from 'react'

import { Calendar, LucideIcon, Mail, User, XIcon } from 'lucide-react'
import {
  Dialog,
  DialogClose,
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
  /** Ref to the card button that opened the modal — focus will be restored to it on close. */
  returnFocusRef?: RefObject<HTMLButtonElement>
}

export const RiskDetailsModal: React.FC<RiskDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  issues,
  icon: Icon,
  color,
  returnFocusRef,
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-sm w-full max-h-[80vh] gap-0 p-0 m-4 overflow-hidden"
        onCloseAutoFocus={(e) => {
          // Restore focus to the card that opened the modal instead of default Radix behavior.
          if (returnFocusRef?.current) {
            e.preventDefault()
            returnFocusRef.current.focus()
          }
        }}
      >
        <DialogClose
          type="button"
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <XIcon aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div
          className="max-h-[80vh] overflow-y-auto p-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          tabIndex={0}
          role="region"
          aria-label="Risk details list"
        >
          <div className="mb-4 flex items-start gap-3 pr-8">
            <div className={`shrink-0 rounded-lg p-2 ${getIconBg(color)}`} aria-hidden="true">
              <Icon size={20} className={getIconColor(color)} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="truncate text-base font-semibold leading-none text-gray-900">
                {title}
              </DialogTitle>
              <DialogDescription className="truncate m-0! text-sm text-gray-500">
                {subtitle}
              </DialogDescription>
            </div>
          </div>

          {issues.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-1 text-base font-medium text-gray-900">No issues found</p>
              <p className="text-sm text-gray-500">
                There are currently no {title.toLowerCase()} requiring attention.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`rounded-lg border border-gray-100 bg-white p-4 shadow-sm ${getSeverityBorderColor(issue.severity)} border-l-4`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="flex-1 pr-2 text-base font-medium leading-tight text-gray-900">
                      {issue.title}
                    </h3>
                    <div className="flex shrink-0 items-center space-x-1 text-sm text-gray-600">
                      <Calendar size={12} aria-hidden="true" />
                      <span>{formatDate(issue.dueDate)}</span>
                    </div>
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-gray-600">{issue.description}</p>

                  {issue.user && (
                    <div className="mb-3 rounded-md bg-gray-50 p-2">
                      <div className="flex min-w-0 items-center space-x-2 text-sm">
                        <User size={14} className="shrink-0 text-gray-500" aria-hidden="true" />
                        <span className="truncate font-medium text-gray-700">
                          {issue.user.name}
                        </span>
                      </div>
                      <div className="mt-1 flex min-w-0 items-center space-x-2 text-sm">
                        <Mail size={14} className="shrink-0 text-gray-500" aria-hidden="true" />
                        <span className="truncate text-gray-600">{issue.user.email}</span>
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
