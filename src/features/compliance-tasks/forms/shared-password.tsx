'use client'

import { ComplianceTask } from '@/types/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Key, CheckCircle, Users } from 'lucide-react'
import { useSharedPasswordForm } from '../hooks/shared-password'

interface SharedPasswordFormProps {
  task: ComplianceTask
}

export const SharedPasswordForm = ({ task }: SharedPasswordFormProps) => {
  const { formComponent } = useSharedPasswordForm(task)
  const dueDate = new Date(task.dueDate)
  const isOverdue = dueDate < new Date()

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
            <Users className="h-6 w-6" />
            Confirm Shared Account Password Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
            <p
              className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {isOverdue
                ? `⚠️ Overdue - Due date: ${dueDate.toLocaleDateString('en-US')}`
                : `📅 Due: ${dueDate.toLocaleDateString('en-US')}`}
            </p>
          </div>

          <div className="bg-muted p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Shared Account Password Requirements</h3>
            </div>

            <div className="space-y-3">
              <p className="text-sm">
                For shared credential accounts (e.g., TikTok, X/Twitter), you must:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Update the shared account password</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Use a strong, unique password (minimum 12 characters)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Securely distribute the new password to authorized team members only</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Document the change in your password management system</span>
                </li>
              </ul>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded mt-4">
                <p className="text-sm">
                  <strong>⚠️ Important:</strong> Never share passwords via email or unencrypted
                  channels. Use your organization&apos;s approved password sharing method.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded mt-4">
                <p className="text-sm">
                  <strong>💡 Best Practice:</strong> Store shared passwords in an enterprise
                  password manager (e.g., 1Password Teams, LastPass Enterprise) and share access
                  through the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="bg-muted p-3 rounded text-xs text-muted-foreground mb-4">
              This confirmation will be recorded in the audit system. You are attesting that the
              shared password has been updated and securely redistributed.
            </div>
            {formComponent}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
