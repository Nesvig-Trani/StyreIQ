import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewUser } from '../../components/view-user'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import type { ComplianceTask } from '@/types/payload-types'

const openDialog = async () => {
  await userEvent.setup().click(screen.getByRole('button', { name: /View Account/ }))
  return screen.getByRole('dialog')
}

const tasksFor = (userId: number, tasks: ComplianceTask[]) => new Map([[userId, tasks]])

describe('ViewUser', () => {
  const camilo = buildUser({
    id: 42,
    name: 'Camilo Ortiz',
    email: 'camilo.ortiz@universidad-andina.edu',
    roles: ['social_media_manager', 'unit_admin'],
    active_role: 'unit_admin',
    status: 'active',
  })

  it('should only show the trigger until it is clicked', () => {
    render(<ViewUser user={camilo} userComplianceTasks={new Map()} />)
    expect(screen.getByRole('button', { name: /View Account/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should show identity, status and every role marking the active one', async () => {
    render(<ViewUser user={camilo} userComplianceTasks={new Map()} />)
    const dialog = await openDialog()

    expect(dialog).toHaveTextContent('Camilo Ortiz')
    expect(dialog).toHaveTextContent('camilo.ortiz@universidad-andina.edu')
    expect(dialog).toHaveTextContent('Active')
    expect(dialog).toHaveTextContent('Social Media Manager')
    expect(dialog).toHaveTextContent('Unit Admin(Active)')
    expect(dialog).not.toHaveTextContent('Social Media Manager(Active)')
  })

  it('should show every compliance item as not assigned when the user has no tasks', async () => {
    render(<ViewUser user={camilo} userComplianceTasks={new Map()} />)
    const dialog = await openDialog()

    expect(dialog.textContent?.match(/Not Assigned/g)).toHaveLength(4)
    expect(dialog).toHaveTextContent('No training assigned.')
    expect(dialog).not.toHaveTextContent('Shared Password Confirmation')
  })

  it('should reflect the status of each compliance task', async () => {
    const tasks = [
      buildComplianceTask({ id: 1, type: 'CONFIRM_2FA', status: 'COMPLETED' }),
      buildComplianceTask({ id: 2, type: 'CONFIRM_USER_PASSWORD', status: 'OVERDUE' }),
      buildComplianceTask({ id: 3, type: 'CONFIRM_SHARED_PASSWORD', status: 'PENDING' }),
      buildComplianceTask({ id: 4, type: 'POLICY_ACKNOWLEDGMENT', status: 'COMPLETED' }),
      buildComplianceTask({
        id: 5,
        type: 'TRAINING_COMPLETION',
        status: 'PENDING',
        description: 'Capacitación en manejo de crisis',
      }),
      buildComplianceTask({ id: 6, type: 'TRAINING_COMPLETION', status: 'COMPLETED' }),
    ]
    render(<ViewUser user={camilo} userComplianceTasks={tasksFor(42, tasks)} />)
    const dialog = await openDialog()

    expect(dialog).toHaveTextContent('Two-Factor AuthenticationCompleted')
    expect(dialog).toHaveTextContent('User Password ConfirmationOverdue')
    expect(dialog).toHaveTextContent('Shared Password ConfirmationPending')
    expect(dialog).toHaveTextContent('Policy AcknowledgmentCompleted')
    expect(dialog).toHaveTextContent('Roll Call ConfirmationNot Assigned')
    expect(dialog).toHaveTextContent('Capacitación en manejo de crisis')
    expect(dialog).toHaveTextContent('Training Task')
  })

  it('should hide the shared password item for users who are not social media managers', async () => {
    const admin = buildUser({ id: 8, roles: ['central_admin'] })
    const tasks = [buildComplianceTask({ type: 'CONFIRM_SHARED_PASSWORD', assignedUser: 8 })]
    render(<ViewUser user={admin} userComplianceTasks={tasksFor(8, tasks)} />)
    const dialog = await openDialog()

    expect(dialog).not.toHaveTextContent('Shared Password Confirmation')
  })

  it('should show the rejection reason only for rejected users', async () => {
    const rejected = buildUser({
      id: 9,
      status: 'rejected',
      reject_reason: 'La cuenta institucional no pertenece al usuario',
    })
    render(<ViewUser user={rejected} userComplianceTasks={new Map()} />)
    const dialog = await openDialog()

    expect(dialog).toHaveTextContent('Rejection Reason')
    expect(dialog).toHaveTextContent('La cuenta institucional no pertenece al usuario')
  })

  it.each([
    ['inactive', 'Inactive'],
    ['pending_activation', 'Pending Activation'],
  ] as const)('should label a %s user as %s without a rejection reason', async (status, label) => {
    render(
      <ViewUser
        user={buildUser({ id: 10, status, reject_reason: 'ignored' })}
        userComplianceTasks={new Map()}
      />,
    )
    const dialog = await openDialog()

    expect(dialog).toHaveTextContent(label)
    expect(dialog).not.toHaveTextContent('Rejection Reason')
  })

  it('should format the creation and update dates', async () => {
    render(
      <ViewUser
        user={buildUser({
          createdAt: '2026-03-05T12:00:00.000Z',
          updatedAt: '2026-09-20T12:00:00.000Z',
        })}
        userComplianceTasks={new Map()}
      />,
    )
    const dialog = await openDialog()

    expect(dialog).toHaveTextContent('Created: March 5, 2026')
    expect(dialog).toHaveTextContent('Last Updated: September 20, 2026')
  })
})
