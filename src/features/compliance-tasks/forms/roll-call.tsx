'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ComplianceTask, SocialMedia } from '@/types/payload-types'

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { completeRollCallTask } from '@/sdk/compliance-task'

interface RollCallFormProps {
  task: ComplianceTask
  assignedAccounts?: SocialMedia[]
}

export const RollCallForm = ({ task, assignedAccounts = [] }: RollCallFormProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const hasAccounts = assignedAccounts.length > 0

  const handleConfirm = async () => {
    if (!confirmed) {
      toast.error('Please confirm by checking the box')
      return
    }

    setIsSubmitting(true)
    try {
      await completeRollCallTask(task.id)
      toast.success('Roll call confirmed successfully')
      router.push('/dashboard/compliance')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete roll call'
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

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
          <CardTitle>Confirm Your Role and Assigned Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mt-2">
              As part of governance, we periodically confirm that your role and assigned social
              media accounts are accurate.
            </p>
            <p
              className={`text-sm font-medium mt-2 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {isOverdue
                ? `⚠️ Overdue - Due date: ${dueDate.toLocaleDateString('en-US')}`
                : `📅 Due: ${dueDate.toLocaleDateString('en-US')}`}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">By confirming, I certify that:</h3>
            <ul className="text-sm space-y-2 ml-4 list-disc">
              <li>My role related to these accounts is current</li>
              <li>The accounts listed below are accurate for my responsibilities</li>
              <li>My contact information and profile are up to date</li>
              <li>I understand this confirmation is recorded for audit purposes</li>
            </ul>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">
              Review the accounts below. If an account is incorrect or missing, contact your Unit
              Admin before confirming.
            </p>

            <h4 className="font-semibold">Assigned Social Media Accounts</h4>

            {hasAccounts ? (
              <div className="space-y-2">
                {assignedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 text-sm border-b pb-2 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{account.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{account.platform}</span>
                        {account.accountHandle && (
                          <>
                            <span>•</span>
                            <span>@{account.accountHandle}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {account.profileUrl && (
                      <a
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 p-3 rounded border border-dashed">
                No accounts are currently assigned to you in StyreIQ.
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 border-t pt-4">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="confirm" className="text-sm cursor-pointer">
              {hasAccounts
                ? 'The account assignments listed above are accurate'
                : 'I confirm I currently have no assigned accounts listed in StyreIQ'}
            </label>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="bg-muted p-3 rounded text-xs text-muted-foreground">
              This confirmation will be recorded in the audit system
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/compliance')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting || !confirmed}
                className="flex-1"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Confirming...' : 'Confirm Role and Accounts'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
