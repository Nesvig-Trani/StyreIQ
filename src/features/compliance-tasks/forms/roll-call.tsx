'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ComplianceTask } from '@/types/payload-types'

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { completeRollCallTask } from '@/sdk/compliance-task'

interface RollCallFormProps {
  task: ComplianceTask
}

export const RollCallForm = ({ task }: RollCallFormProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
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

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/dashboard/compliance">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Account Confirmation - Roll Call</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Confirm Your Active Account</h2>
            <p className="text-sm text-muted-foreground mt-2">
              As part of our governance policies, we need to periodically confirm that your account
              is still necessary and active.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">✓ By confirming, I certify that:</h3>
            <ul className="text-sm space-y-2 ml-4 list-disc">
              <li>My account is still necessary for my job responsibilities</li>
              <li>I have active access to the social media accounts assigned to me</li>
              <li>My contact information and profile are up to date</li>
              <li>I have completed all required training</li>
              <li>I am aware of the current social media usage policies</li>
            </ul>
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
              <Button onClick={handleConfirm} disabled={isSubmitting} className="flex-1">
                <CheckCircle className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Confirming...' : 'Confirm My Active Account'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
