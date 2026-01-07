import { notFound } from 'next/navigation'

import { PasswordSetupForm } from '@/features/compliance-tasks/forms/password-setup-form'
import { getTaskForUser } from '@/features/compliance-tasks/plugins/queries'
import { TrainingForm } from '@/features/compliance-tasks/forms/training'
import { RollCallForm } from '@/features/compliance-tasks/forms/roll-call'

import { TwoFactorForm } from '@/features/compliance-tasks/forms/two-factor-form'
import { UserPasswordForm } from '@/features/compliance-tasks/forms/user-password'
import { SharedPasswordForm } from '@/features/compliance-tasks/forms/shared-password'

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

    case 'user-password':
      return <UserPasswordForm task={task} />

    case 'shared-password':
      return <SharedPasswordForm task={task} />

    case '2fa':
      return <TwoFactorForm task={task} />

    case 'training':
      return <TrainingForm task={task} />

    case 'roll-call':
      return <RollCallForm task={task} />

    default:
      notFound()
  }
}
