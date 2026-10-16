import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import { UserDetailsDialog } from '../../components/details'
import { getTaskStatus, TaskStatusIcon } from '../../components/details/task-status-icon'

const mateo = buildUser({
  id: 12,
  name: 'Mateo Giraldo',
  email: 'mateo.giraldo@universidad-andina.edu',
  roles: ['unit_admin', 'social_media_manager'],
  status: 'active',
  loginAttempts: 2,
})

const renderDialog = ({
  user = mateo,
  tasks = [],
  isOpen = true,
  onOpenChange = vi.fn(),
}: {
  user?: typeof mateo
  tasks?: ReturnType<typeof buildComplianceTask>[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
} = {}) =>
  render(
    <UserDetailsDialog
      user={user}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      userComplianceTasks={new Map([[user.id, tasks]])}
      trigger={<button>Ver detalles</button>}
    />,
  )

describe('getTaskStatus', () => {
  it('should report a missing task as not assigned', () => {
    expect(getTaskStatus(undefined).label).toBe('Not Assigned')
  })

  it.each([
    ['COMPLETED', 'Completed'],
    ['OVERDUE', 'Overdue'],
    ['PENDING', 'Pending'],
  ] as const)('should label %s tasks as %s', (status, label) => {
    expect(getTaskStatus(buildComplianceTask({ status })).label).toBe(label)
  })

  it('should render the status label in the icon component', () => {
    render(<TaskStatusIcon task={buildComplianceTask({ status: 'OVERDUE' })} />)
    expect(screen.getByText('Overdue')).toHaveClass('text-red-700')
  })
})

describe('UserDetailsDialog', () => {
  it('should show identity, roles, status and login attempts', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByText('Mateo Giraldo').length).toBeGreaterThan(0)
    expect(within(dialog).getByText('mateo.giraldo@universidad-andina.edu')).toBeInTheDocument()
    expect(within(dialog).getAllByText('Unit Admin').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('Social Media Manager').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('Active').length).toBeGreaterThan(0)
    expect(within(dialog).getByText('2')).toBeInTheDocument()
  })

  it('should mark security and policy tasks that are not assigned', () => {
    renderDialog()
    expect(screen.getAllByText('Not Assigned')).toHaveLength(4)
    expect(screen.queryByText('Shared Password Confirmation')).not.toBeInTheDocument()
    expect(screen.getByText('No training assigned.')).toBeInTheDocument()
  })

  it('should show the status of each compliance task assigned to the user', () => {
    renderDialog({
      tasks: [
        buildComplianceTask({ id: 1, type: 'CONFIRM_2FA', status: 'COMPLETED' }),
        buildComplianceTask({ id: 2, type: 'CONFIRM_SHARED_PASSWORD', status: 'PENDING' }),
        buildComplianceTask({ id: 3, type: 'POLICY_ACKNOWLEDGMENT', status: 'OVERDUE' }),
        buildComplianceTask({
          id: 4,
          type: 'TRAINING_COMPLETION',
          status: 'PENDING',
          description: 'Complete: Social Media Risk Mitigation',
        }),
      ],
    })
    expect(screen.getByText('Shared Password Confirmation')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Complete: Social Media Risk Mitigation')).toBeInTheDocument()
    expect(screen.queryByText('No training assigned.')).not.toBeInTheDocument()
  })

  it('should show the rejection reason for rejected users', () => {
    renderDialog({
      user: buildUser({
        ...mateo,
        status: 'rejected',
        reject_reason: 'Cuenta duplicada en la Facultad de Artes',
      }),
    })
    expect(screen.getByText('Rejection Information')).toBeInTheDocument()
    expect(screen.getByText('Cuenta duplicada en la Facultad de Artes')).toBeInTheDocument()
  })

  it('should not show rejection information for other users', () => {
    renderDialog()
    expect(screen.queryByText('Rejection Information')).not.toBeInTheDocument()
  })

  it('should request opening when the trigger is clicked', async () => {
    const onOpenChange = vi.fn()
    renderDialog({ isOpen: false, onOpenChange })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Ver detalles' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})
