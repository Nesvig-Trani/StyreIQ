import { notFound } from 'next/navigation'

import { PasswordSetupForm } from '@/features/compliance-tasks/forms/password-setup-form'
import { getTaskForUser } from '@/features/compliance-tasks/plugins/queries'
import { TrainingForm } from '@/features/compliance-tasks/forms/training'
import { RollCallForm } from '@/features/compliance-tasks/forms/roll-call'

export default async function CompleteTaskPage({
  params,
}: {
  params: Promise<{ taskType: string; taskId: string }>
}) {
  const { taskType, taskId } = await params
  const task = await getTaskForUser(taskId)

  switch (taskType) {
    case 'password-setup':
      return <PasswordSetupForm task={task} />

    case 'training':
      return <TrainingForm task={task} />

    case 'roll-call':
      return <RollCallForm task={task} />

    default:
      notFound()
  }
}
