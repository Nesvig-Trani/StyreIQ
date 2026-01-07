'use client'

import { ComplianceTask } from '@/types/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { useTwoFactorForm } from '../hooks/two-factor'

interface TwoFactorFormProps {
  task: ComplianceTask
}

export const TwoFactorForm = ({ task }: TwoFactorFormProps) => {
  const { formComponent } = useTwoFactorForm(task)
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
            <Shield className="h-6 w-6" />
            Confirm Two-Factor Authentication (2FA)
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
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Two-Factor Authentication (2FA)</h3>
            </div>

            <div className="space-y-3">
              <p className="text-sm">
                You must enable 2FA on all social media accounts you manage:
              </p>

              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium text-sm">Facebook/Instagram</p>
                  <p className="text-xs text-muted-foreground">
                    Settings → Security → Two-step verification
                  </p>
                </div>

                <div className="border-l-4 border-sky-500 pl-4 py-2">
                  <p className="font-medium text-sm">Twitter/X</p>
                  <p className="text-xs text-muted-foreground">
                    Settings → Security → Two-factor authentication
                  </p>
                </div>

                <div className="border-l-4 border-red-500 pl-4 py-2">
                  <p className="font-medium text-sm">LinkedIn</p>
                  <p className="text-xs text-muted-foreground">
                    Settings → Account → Two-step verification
                  </p>
                </div>

                <div className="border-l-4 border-red-600 pl-4 py-2">
                  <p className="font-medium text-sm">TikTok</p>
                  <p className="text-xs text-muted-foreground">
                    Settings → Security → 2-step verification
                  </p>
                </div>

                <div className="border-l-4 border-red-700 pl-4 py-2">
                  <p className="font-medium text-sm">YouTube</p>
                  <p className="text-xs text-muted-foreground">
                    Google Account → Security → 2-Step Verification
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded mt-4">
                <p className="text-sm">
                  <strong>⚠️ Important:</strong> Use an authenticator app (Google Authenticator,
                  Microsoft Authenticator, Authy) instead of SMS when possible.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded mt-4">
                <p className="text-sm">
                  <strong>💡 Tip:</strong> Save backup codes in a secure location in case you lose
                  access to your authenticator device.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="bg-muted p-3 rounded text-xs text-muted-foreground mb-4">
              This confirmation will be recorded in the audit system. You are attesting that 2FA is
              enabled on all applicable accounts.
            </div>
            {formComponent}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
