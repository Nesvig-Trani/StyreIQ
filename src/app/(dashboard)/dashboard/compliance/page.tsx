import React from 'react'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { Card, CardContent, Badge, Button } from '@/shared'
import { getComplianceTasksForUser } from '@/features/compliance-tasks/plugins/queries'
import { redirect } from 'next/navigation'
import { ComplianceTask } from '@/types/payload-types'
import {
  getTaskTypeLabel,
  getActionUrlForTask,
  getTaskStatusColor,
} from '@/features/compliance-tasks/constants/taskHelpers'
import Link from 'next/link'
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'

export default async function ComplianceTasksPage() {
  const { user } = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const tasks = await getComplianceTasksForUser(user.id)

  const overdueTasks = tasks.docs.filter((t) => t.status === 'OVERDUE')
  const pendingTasks = tasks.docs.filter((t) => t.status === 'PENDING')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold">My Compliance Tasks</h2>
                  {pendingTasks.length > 0 && (
                    <Badge variant="secondary">{pendingTasks.length} Pending</Badge>
                  )}
                  {overdueTasks.length > 0 && (
                    <Badge variant="destructive">{overdueTasks.length} Overdue</Badge>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    Complete your required actions to maintain compliance.
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click Take Action to review the requirement and submit your confirmation. If
                    something looks incorrect, contact your Unit Admin.
                    {overdueTasks.length > 0 && (
                      <strong className="text-destructive">
                        {' '}
                        Overdue tasks may result in escalations to your supervisor.
                      </strong>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {tasks.docs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold">Excellent work!</p>
              <p className="text-muted-foreground">You have no pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.docs.map((task: ComplianceTask) => {
                const isOverdue = task.status === 'OVERDUE'
                const dueDate = new Date(task.dueDate)
                const now = new Date()
                const daysUntilDue = Math.ceil(
                  (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                )

                return (
                  <Card key={task.id} className={isOverdue ? 'border-destructive' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            {isOverdue ? (
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                            <h3 className="font-semibold text-lg">{getTaskTypeLabel(task.type)}</h3>
                            <Badge variant={getTaskStatusColor(task.status)}>
                              {task.status === 'OVERDUE' ? 'Overdue' : 'Pending'}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">{task.description}</p>

                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                              {isOverdue
                                ? `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`
                                : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
                            </span>
                            <span className="text-muted-foreground">
                              (
                              {dueDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                              )
                            </span>
                          </div>

                          {task.remindersSent && task.remindersSent.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {task.remindersSent.length} reminder(s) sent
                            </p>
                          )}
                        </div>

                        <Button asChild size="default" variant="secondary" className="shrink-0">
                          <Link href={getActionUrlForTask(task)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Take Action
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
