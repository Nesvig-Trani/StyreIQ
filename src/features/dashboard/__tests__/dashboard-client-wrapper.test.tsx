import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { DashboardRiskSection } from '@/features/dashboard/components/dashboard-client-wrapper'
import { buildComplianceTask, buildFlag, buildUser } from '@/shared/__tests__/fixtures'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'

const payload = createFakePayload()

vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: payload.asPayload() }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const jimena = buildUser({
  id: 9,
  name: 'Jimena Salazar',
  email: 'jimena.salazar@universidad-andina.edu',
})
const rafael = buildUser({ id: 7, name: '', email: 'rafael.mejia@universidad-andina.edu' })

const emptyFlags = {
  accessManagement: { count: 0, data: [] },
  security: { count: 0, data: [] },
  policiesTraining: { count: 0, data: [] },
  flaggedIssues: { count: 0, data: [] },
}

beforeEach(() => {
  payload.find.mockReset()
  payload.find.mockResolvedValue({ docs: [jimena, rafael], totalDocs: 2 })
  vi.mocked(toast.error).mockReset()
})

describe('DashboardRiskSection', () => {
  it('should render the four risk categories with their issue counts', () => {
    render(
      <DashboardRiskSection
        flags={{
          accessManagement: { count: 3, data: [] },
          security: { count: 1, data: [] },
          policiesTraining: { count: 0, data: [] },
          flaggedIssues: { count: 5, data: [] },
        }}
      />,
    )
    expect(
      screen.getByLabelText(
        /Review and confirm access to assigned social media accounts, 3 issues/,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Confirm required security practices for users and accounts, 1 issue$/),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Resolve manually flagged issues, 5 issues/)).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('should open an empty modal for a category without issues', async () => {
    render(<DashboardRiskSection flags={emptyFlags} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open category — Flagged Issues' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('No issues found')).toBeVisible()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should convert flags into issues resolving the affected users once', async () => {
    const flags = {
      ...emptyFlags,
      accessManagement: {
        count: 2,
        data: [
          buildFlag({
            id: 1,
            flagType: 'missing_2fa',
            description: 'La cuenta de Instagram no tiene 2FA',
            affectedEntity: { relationTo: 'users', value: 9 },
            dueDate: '2026-11-05T12:00:00.000Z',
          }),
          buildFlag({
            id: 2,
            flagType: 'outdated_password',
            affectedEntity: { relationTo: 'users', value: jimena },
          }),
        ],
      },
    }
    render(<DashboardRiskSection flags={flags} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open category — Access Management' }))
    const dialog = await screen.findByRole('dialog')

    expect(await within(dialog).findByText('Missing 2FA')).toBeVisible()
    expect(within(dialog).getByText('Outdated Password')).toBeVisible()
    expect(within(dialog).getByText('La cuenta de Instagram no tiene 2FA')).toBeVisible()
    expect(within(dialog).getByText('No description provided')).toBeVisible()
    expect(within(dialog).getAllByText('Jimena Salazar')).toHaveLength(2)
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        where: { id: { in: [9] } },
      }),
    )
  })

  it('should convert compliance tasks into issues with readable labels', async () => {
    const flags = {
      ...emptyFlags,
      policiesTraining: {
        count: 2,
        data: [
          buildComplianceTask({
            id: 11,
            type: 'POLICY_ACKNOWLEDGMENT',
            status: 'OVERDUE',
            assignedUser: 9,
            description: 'Aceptar la política de uso de redes',
          }),
          buildComplianceTask({
            id: 12,
            type: 'TRAINING_COMPLETION',
            status: 'PENDING',
            assignedUser: rafael,
          }),
        ],
      },
    }
    render(<DashboardRiskSection flags={flags} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Open category — Policies & Training' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Policy Acknowledgment')).toBeVisible()
    expect(within(dialog).getByText('Training Completion')).toBeVisible()
    expect(within(dialog).getByText('Aceptar la política de uso de redes')).toBeVisible()
    expect(within(dialog).getByText('rafael.mejia@universidad-andina.edu')).toBeVisible()
    expect(within(dialog).getByText('Usuario sin nombre')).toBeVisible()
  })

  it('should open the security category without loading users when none are referenced', async () => {
    const flags = {
      ...emptyFlags,
      security: {
        count: 1,
        data: [
          buildFlag({
            id: 3,
            flagType: 'security_risk',
            affectedEntity: { relationTo: 'organization', value: 100 },
          }),
        ],
      },
    }
    render(<DashboardRiskSection flags={flags} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Open category — Security Requirements' }),
    )
    expect(await screen.findByText('Security Risk')).toBeVisible()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should notify the user when loading the risk details fails', async () => {
    payload.find.mockRejectedValue(new Error('db down'))
    const flags = {
      ...emptyFlags,
      flaggedIssues: {
        count: 1,
        data: [
          buildFlag({
            id: 4,
            flagType: 'incident_open',
            affectedEntity: { relationTo: 'users', value: 9 },
          }),
        ],
      },
    }
    render(<DashboardRiskSection flags={flags} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open category — Flagged Issues' }))
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to load flagged issues details. Please try again.',
      ),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should return focus to the card that opened the modal', async () => {
    render(<DashboardRiskSection flags={emptyFlags} />)
    const card = screen.getByRole('button', { name: 'Open category — Flagged Issues' })
    await userEvent.click(card)
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await vi.waitFor(() => expect(card).toHaveFocus())
  })
})
