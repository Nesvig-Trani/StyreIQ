import React from 'react'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/shared'
import { redirect } from 'next/navigation'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { BookOpen, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const TRAINING_LINKS: Record<
  string,
  {
    title: string
    description: string
    url: string
    category: string
  }
> = {
  'training-governance': {
    title: 'Social Media Governance Essentials: Accessibility, Compliance & Risk',
    description:
      'Understand policies, accessibility standards, compliance risks, and organizational values.',
    url: '/trainings/governance-essentials/index.html',
    category: 'Governance',
  },
  'training-risk': {
    title: 'Social Media Risk Mitigation',
    description: 'Safeguard accounts, handle crises, and follow legal and ethical standards.',
    url: '/trainings/risk-mitigation/index.html',
    category: 'Risk Management',
  },
  'training-leadership': {
    title: 'A Leadership Guide to Social Media Crisis Management',
    description: 'Learn to manage social media during high-risk and crisis situations.',
    url: '/trainings/leadership-guide/index.html',
    category: 'Crisis Management',
  },
}

export default async function ResourcesPage() {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()

  if (!user) {
    redirect('/login')
  }

  const completedTrainings: string[] = []
  if (user.isCompletedTrainingGovernance) completedTrainings.push('training-governance')
  if (user.isCompletedTrainingRisk) completedTrainings.push('training-risk')
  if (user.isCompletedTrainingLeadership) completedTrainings.push('training-leadership')

  const assignedTrainings = await payload.find({
    collection: 'compliance_tasks',
    where: {
      and: [
        { assignedUser: { equals: user.id } },
        { type: { equals: 'TRAINING_COMPLETION' } },
        { status: { equals: 'COMPLETED' } },
      ],
    },
    limit: 0,
  })

  const assignedTrainingIds = assignedTrainings.docs
    .map((task) => task.relatedTraining)
    .filter(Boolean) as string[]

  const uniqueTrainingIds = Array.from(new Set([...assignedTrainingIds, ...completedTrainings]))

  const availableTrainings = uniqueTrainingIds
    .map((id) => {
      const trainingInfo = TRAINING_LINKS[id]

      if (!trainingInfo) {
        return null
      }

      return {
        id,
        ...trainingInfo,
        completed: completedTrainings.includes(id),
      }
    })
    .filter((t): t is NonNullable<typeof t> => t !== null && t.title !== undefined)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle>Training Resources</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Review trainings you&apos;ve completed. Assigned trainings appear in My Tasks until
            they&apos;re completed.
          </p>
        </CardHeader>
        <CardContent>
          {availableTrainings.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">No completed trainings yet</p>
              <p className="text-muted-foreground">
                When you complete a training from My Tasks, it will appear here for easy reference.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {availableTrainings.map((training) => (
                <Card key={training.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{training.title}</h3>
                            {training.completed && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="mb-3">
                            {training.category}
                          </Badge>
                          <p className="text-sm text-muted-foreground">{training.description}</p>
                        </div>
                      </div>
                      <Button asChild className="w-full" variant="outline">
                        <a href={training.url} target="_blank" rel="noopener noreferrer">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {training.completed ? 'Review Training' : 'Start Training'}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> Training links stay available here after completion so you can
              revisit the material anytime. To start an assigned training, go to My Tasks.
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/compliance">← Back to My Compliance Tasks</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
