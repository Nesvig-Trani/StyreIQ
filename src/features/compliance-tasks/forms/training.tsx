'use client'

import React from 'react'
import { ComplianceTask } from '@/types/payload-types'

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useTrainingForm } from '../hooks/useTraining'

const TRAINING_PATHS: Record<string, string> = {
  'training-governance': '/trainings/governance-essentials/index.html',
  'training-risk': '/trainings/risk-mitigation/index.html',
  'training-leadership': '/trainings/leadership-guide/index.html',
}

const TRAINING_CONTENT: Record<
  string,
  {
    about: string
    objectives: string[]
  }
> = {
  'training-governance': {
    about:
      'This course explains the fundamentals of social media governance. It covers accessibility, compliance, and risk expectations for organizational accounts.',
    objectives: [
      'Learn how social media policies apply to your role and responsibilities.',
      'Create content that meets accessibility standards across platforms.',
      'Recognize common compliance risks and how to avoid them.',
      'Align social media activity with organizational standards and values.',
    ],
  },
  'training-risk': {
    about:
      'This course helps you reduce social media risk. It focuses on real scenarios and practical decision-making.',
    objectives: [
      'Safeguard accounts from hacking, phishing, and unauthorized access. Protect sensitive information.',
      'Keep messaging, behavior, and interactions consistent across platforms. Support professionalism and trust.',
      'Use proactive strategies for emergencies, misinformation, and audience backlash.',
      'Follow legal, ethical, and accessibility standards. Apply inclusive, compliant practices across platforms.',
    ],
  },
  'training-leadership': {
    about:
      'This course is designed for leaders and decision-makers. It focuses on managing social media during high-risk and crisis situations.',
    objectives: [
      'Understand leadership responsibilities during social media incidents.',
      'Align communications, legal, and leadership roles during escalation.',
      'Use structured approaches to guide timely, effective responses.',
      'Reduce confusion, delays, and reputational harm during crises.',
    ],
  },
}

interface TrainingFormProps {
  task: ComplianceTask
}

export const TrainingForm = ({ task }: TrainingFormProps) => {
  const { formComponent } = useTrainingForm(task)
  const trainingId = task.relatedTraining || 'training-risk'
  const trainingPath = TRAINING_PATHS[trainingId]
  const content = TRAINING_CONTENT[trainingId] || TRAINING_CONTENT['training-risk']

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
            {task.description?.replace('Complete: ', '') || 'Training'}
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

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">About this training</h3>
            <p className="text-sm">{content.about}</p>
          </div>

          <div className="bg-muted p-6 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">What you will gain from this training</h3>
            <ul className="space-y-2">
              {content.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>

          {trainingPath && (
            <div className="border-t border-b py-6 text-white">
              <Button asChild className="w-full text-white" size="lg">
                <a href={trainingPath} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Start Training
                </a>
              </Button>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">To complete this training</h3>
            <ol className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <span className="font-semibold">1.</span>
                <span>Open the training using the link provided</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="font-semibold">2.</span>
                <span>Complete the training before the due date</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="font-semibold">3.</span>
                <span>Return here to confirm completion</span>
              </li>
            </ol>
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
