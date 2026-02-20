'use client'

import { ComplianceTask } from '@/types/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Key, CheckCircle } from 'lucide-react'
import { useUserPasswordForm } from '../hooks/user-password'

interface UserPasswordFormProps {
  task: ComplianceTask
}

export const UserPasswordForm = ({ task }: UserPasswordFormProps) => {
  const { formComponent } = useUserPasswordForm(task)
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
            <Key className="h-6 w-6" />
            Confirm Personal Password Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p
              className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {isOverdue
                ? `⚠️ Overdue - Due date: ${dueDate.toLocaleDateString('en-US')}`
                : `📅 Due: ${dueDate.toLocaleDateString('en-US')}`}
            </p>
          </div>

          <div className="space-y-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-sm">
              Confirm you updated your personal login password according to your organization&apos;s
              requirements. This applies to accounts you access using an individual user login (your
              own account credentials).
            </p>

            <div className="text-sm">
              <strong>StyreIQ distinguishes between:</strong>
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                <li>
                  Personal credentials used to access platforms tied to an individual user (e.g.,
                  Meta)
                </li>
                <li>Shared credentials used by teams to access a single account (e.g., TikTok)</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Secure Password Requirements</h3>
            </div>

            <div className="space-y-3">
              <p className="text-sm">Your password must meet the following requirements:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Strong and unique (16+ characters recommended)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Not reused across services</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Updated on schedule required by your organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Stored in your approved password manager (recommended)</span>
                </li>
              </ul>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded mt-4">
                <p className="text-sm">
                  <strong>💡 Tip:</strong> Use a password manager to generate and store secure
                  passwords.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="bg-muted p-3 rounded text-xs text-gray-600 mb-4">
              This confirmation will be recorded in the audit system.
            </div>
            {formComponent}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
