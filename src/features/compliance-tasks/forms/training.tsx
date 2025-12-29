'use client'

import React from 'react'
import { ComplianceTask } from '@/types/payload-types'

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared'
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useTrainingForm } from '../hooks/useTraining'
import { getTrainingInfo } from '../plugins/queries'

interface TrainingFormProps {
  task: ComplianceTask
}

export const TrainingForm = ({ task }: TrainingFormProps) => {
  const { formComponent } = useTrainingForm(task)
  const trainingInfo = getTrainingInfo(task.relatedTraining || '')
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
            <BookOpen className="h-6 w-6" />
            {trainingInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
            <p
              className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {isOverdue
                ? `⚠️ Overdue - Due date: ${dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : `📅 Due: ${dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>

          <div className="bg-muted p-6 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">{trainingInfo.title}</h3>

            <div className="space-y-3">
              <h4 className="font-medium">📚 Topics Covered:</h4>
              <ul className="space-y-2 ml-4">
                {trainingInfo.topics.map((topic, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">🎯 Learning Objectives:</h4>
              <ul className="space-y-2 ml-4">
                {trainingInfo.objectives.map((objective, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <p className="text-sm mb-3">
                <strong>📋 To complete this training:</strong>
              </p>
              <ol className="text-sm space-y-2 ml-4 list-decimal">
                <li>Review all topics and learning objectives listed above</li>
                <li>Ensure you fully understand the material</li>
                <li>Check the confirmation box below</li>
              </ol>
            </div>

            <div className="bg-muted p-3 rounded text-xs text-muted-foreground mb-4">
              This confirmation will be recorded in the audit system
            </div>

            {formComponent}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
