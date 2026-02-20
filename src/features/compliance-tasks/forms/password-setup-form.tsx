'use client'

import React from 'react'
import { ComplianceTask } from '@/types/payload-types'

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared'
import { ArrowLeft, Shield, Key, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { usePasswordSetupForm } from '../hooks/usePasswordSetup'

interface PasswordSetupFormProps {
  task: ComplianceTask
}

export const PasswordSetupForm = ({ task }: PasswordSetupFormProps) => {
  const { formComponent } = usePasswordSetupForm(task)
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
            Password & 2FA Setup
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
              <h3 className="font-semibold text-lg">1. Secure Password</h3>
            </div>

            <div className="space-y-3 ml-7">
              <p className="text-sm">Your password must meet the following requirements:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Minimum 12 characters in length</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Combination of uppercase and lowercase letters</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>At least one number</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>At least one special character (!@#$%^&*)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Do not use common passwords or personal information</span>
                </li>
              </ul>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded mt-4">
                <p className="text-sm">
                  <strong>💡 Tip:</strong> Use a password manager like 1Password, LastPass, or
                  Bitwarden to generate and store secure passwords.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">2. Two-Factor Authentication (2FA)</h3>
            </div>

            <div className="space-y-3 ml-7">
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
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded mt-4">
                <p className="text-sm">
                  <strong>⚠️ Important:</strong> Use an authenticator app (Google Authenticator,
                  Microsoft Authenticator, Authy) instead of SMS when possible.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="bg-muted p-3 rounded text-xs text-gray-600 mb-4">
              This confirmation will be recorded in the audit system. It is your responsibility to
              maintain the security of your credentials.
            </div>
            {formComponent}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
