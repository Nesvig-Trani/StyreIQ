'use client'

import React from 'react'
import { ComplianceTask, Flag, Organization, SocialMedia, User } from '@/types/payload-types'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/shared'
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useFlagResolution } from '../hooks/use-flag-resolution'

interface FlagResolutionFormProps {
  task: ComplianceTask
  flag: Flag
}

export const FlagResolutionForm = ({ task, flag }: FlagResolutionFormProps) => {
  const { formComponent } = useFlagResolution(task)
  const dueDate = new Date(task.dueDate)
  const isOverdue = dueDate < new Date()

  const getAffectedEntityDisplay = () => {
    if (!flag.affectedEntity || typeof flag.affectedEntity !== 'object') {
      return 'Unknown'
    }

    const { relationTo, value } = flag.affectedEntity as {
      relationTo: string
      value: User | SocialMedia | Organization
    }

    if (relationTo === 'social-medias' && typeof value === 'object' && 'platform' in value) {
      return `@${value.name} (${value.platform})`
    }

    if (relationTo === 'organization' && typeof value === 'object') {
      return value.name
    }

    return 'Unknown'
  }

  const getFlagTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SECURITY_CONCERN: 'Security Concern',
      OPERATIONAL_ISSUE: 'Operational Issue',
      OTHER: 'Other',
    }
    return labels[type] || type
  }

  const getEntityTypeLabel = () => {
    if (!flag.affectedEntity || typeof flag.affectedEntity !== 'object') {
      return 'Unknown'
    }

    const { relationTo } = flag.affectedEntity as { relationTo: string }

    const labels: Record<string, string> = {
      'social-medias': 'Social Media Account',
      organization: 'Organizational Unit',
    }

    return labels[relationTo] || relationTo
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/dashboard/compliance">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Link>
      </Button>

      <Card className={isOverdue ? 'border-destructive' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Review Risk Flag
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isOverdue && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-900 dark:text-red-100">
                This flag is overdue
              </span>
            </div>
          )}

          <div>
            <p
              className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {isOverdue
                ? `⚠️ Overdue - Due date: ${dueDate.toLocaleDateString('en-US')}`
                : `📅 Due: ${dueDate.toLocaleDateString('en-US')}`}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-sm">
              This issue has been flagged for review. Please read the details below, take any needed
              action, and submit your confirmation by the due date. If you have questions, reply to
              the email notification to coordinate with the relevant roles.
            </p>
          </div>

          <div className="bg-muted p-6 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Badge variant="outline">{getFlagTypeLabel(flag.flagType ?? 'unknown')}</Badge>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Affected Entity Type</p>
                <p className="text-sm font-medium">{getEntityTypeLabel()}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Affected Entity</p>
                <p className="text-sm font-medium">{getAffectedEntityDisplay()}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Date Flagged</p>
                {flag.detectionDate && (
                  <p className="text-sm font-medium">
                    {new Date(flag.detectionDate).toLocaleDateString('en-US')}
                  </p>
                )}
              </div>

              {flag.createdBy && typeof flag.createdBy === 'object' && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Flagged By</p>
                  <p className="text-sm font-medium">
                    {flag.createdBy.name || flag.createdBy.email}
                  </p>
                </div>
              )}

              {flag.assignedTo && typeof flag.assignedTo === 'object' && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <p className="text-sm font-medium">
                    {flag.assignedTo.name || flag.assignedTo.email}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Risk Description</p>
              <p className="text-sm">{flag.description}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Suggested Action</p>
              <p className="text-sm">{flag.suggestedAction}</p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">What you will do</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span>Review the flagged issue details</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span>Coordinate with the relevant people if needed</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span>Take appropriate action based on your organization&apos;s process</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span>Record the outcome before marking this task complete</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <div className="bg-muted p-3 rounded text-xs text-muted-foreground mb-4">
              This confirmation will be recorded in the audit system.
            </div>
            {formComponent}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
