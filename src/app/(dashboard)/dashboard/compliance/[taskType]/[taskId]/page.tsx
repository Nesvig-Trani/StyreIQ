import { notFound } from 'next/navigation'

import { PasswordSetupForm } from '@/features/compliance-tasks/forms/password-setup-form'
import {
  getTaskForUser,
  getTaskForUserWithAccounts,
  getTaskForUserWithFlag,
} from '@/features/compliance-tasks/plugins/queries'
import { TrainingForm } from '@/features/compliance-tasks/forms/training'
import { RollCallForm } from '@/features/compliance-tasks/forms/roll-call'

import { TwoFactorForm } from '@/features/compliance-tasks/forms/two-factor-form'
import { UserPasswordForm } from '@/features/compliance-tasks/forms/user-password'
import { SharedPasswordForm } from '@/features/compliance-tasks/forms/shared-password'
import { FlagResolutionForm } from '@/features/compliance-tasks/forms/flag-resolution'

export default async function CompleteTaskPage({
  params,
}: {
  params: Promise<{ taskType: string; taskId: string }>
}) {
  const { taskType, taskId } = await params

  if (taskType === 'roll-call') {
    const { task, assignedAccounts } = await getTaskForUserWithAccounts(taskId)
    return <RollCallForm task={task} assignedAccounts={assignedAccounts} />
  }

  if (taskType === 'review-flag') {
    const { task, flag } = await getTaskForUserWithFlag(taskId)
    return <FlagResolutionForm task={task} flag={flag} />
  }

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

    default:
      notFound()
  }
}
