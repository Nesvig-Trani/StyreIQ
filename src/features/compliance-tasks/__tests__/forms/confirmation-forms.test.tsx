import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { buildComplianceTask } from '@/shared/__tests__/fixtures'
import { UserPasswordForm } from '../../forms/user-password'
import { SharedPasswordForm } from '../../forms/shared-password'
import { TwoFactorForm } from '../../forms/two-factor-form'
import { PasswordSetupForm } from '../../forms/password-setup-form'
import { TrainingForm } from '../../forms/training'

// Only the router, the toast UI and the network are faked; forms, hooks and schemas are real.
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()
const okResponse = () => new Response(JSON.stringify({ success: true }), { status: 200 })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 16, 9, 0, 0))
  vi.stubGlobal('fetch', fetchMock)
  // jsdom has no ResizeObserver, which Radix checkboxes rely on.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => okResponse())
  router.push.mockClear()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const upcoming = new Date(2026, 9, 30, 12).toISOString()
const overdue = new Date(2026, 9, 1, 12).toISOString()

const cases = [
  {
    name: 'UserPasswordForm',
    render: (dueDate: string) => (
      <UserPasswordForm
        task={buildComplianceTask({ id: 42, type: 'CONFIRM_USER_PASSWORD', dueDate })}
      />
    ),
    heading: 'Confirm Personal Password Update',
    checkbox: /I confirm that I updated my personal login passwords/,
    submit: 'Confirm Password Update',
    endpoint: 'complete-user-password',
    success: 'Password confirmation recorded successfully',
  },
  {
    name: 'SharedPasswordForm',
    render: (dueDate: string) => (
      <SharedPasswordForm
        task={buildComplianceTask({ id: 42, type: 'CONFIRM_SHARED_PASSWORD', dueDate })}
      />
    ),
    heading: 'Confirm Shared Account Password Update',
    checkbox: /I confirm the shared credential was updated/,
    submit: 'Confirm Shared Password Update',
    endpoint: 'complete-shared-password',
    success: 'Shared password confirmation recorded successfully',
  },
  {
    name: 'TwoFactorForm',
    render: (dueDate: string) => (
      <TwoFactorForm task={buildComplianceTask({ id: 42, type: 'CONFIRM_2FA', dueDate })} />
    ),
    heading: 'Confirm Two-Factor Authentication (2FA)',
    checkbox: /two-factor authentication \(2FA\) is enabled/,
    submit: 'Confirm 2FA Enabled',
    endpoint: 'complete-2fa',
    success: '2FA confirmation recorded successfully',
  },
]

describe.each(cases)('$name', (scenario) => {
  it('should show the task heading and an upcoming due date', () => {
    render(scenario.render(upcoming))

    expect(screen.getByRole('heading', { level: 1, name: scenario.heading })).toBeInTheDocument()
    expect(screen.getByText(/Due: 10\/30\/2026/)).toBeInTheDocument()
  })

  it('should flag the task as overdue when the due date has passed', () => {
    render(scenario.render(overdue))

    expect(screen.getByText(/Overdue - Due date: 10\/1\/2026/)).toBeInTheDocument()
  })

  it('should not submit until the confirmation checkbox is checked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(scenario.render(upcoming))

    await user.click(screen.getByRole('button', { name: scenario.submit }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('should complete the task, notify and go back to the task list when confirmed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(scenario.render(upcoming))

    await user.click(screen.getByRole('checkbox', { name: scenario.checkbox }))
    await user.click(screen.getByRole('button', { name: scenario.submit }))

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard/compliance'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`https://app.styreiq.test/api/compliance_tasks/42/${scenario.endpoint}`)
    expect(init?.method).toBe('PATCH')
    expect(toast.success).toHaveBeenCalledWith(scenario.success)
  })

  it('should show an error toast and stay on the page when the API fails', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({}), { status: 500 }))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(scenario.render(upcoming))

    await user.click(screen.getByRole('checkbox', { name: scenario.checkbox }))
    await user.click(screen.getByRole('button', { name: scenario.submit }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to complete task'))
    expect(router.push).not.toHaveBeenCalled()
  })

  it('should return to the task list when cancelling', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(scenario.render(upcoming))

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(router.push).toHaveBeenCalledWith('/dashboard/compliance')
  })
})

describe('PasswordSetupForm', () => {
  it('should require both confirmations before completing the setup', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <PasswordSetupForm
        task={buildComplianceTask({ id: 42, type: 'PASSWORD_SETUP', dueDate: upcoming })}
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Password & 2FA Setup' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /set up a secure password/ }))
    await user.click(screen.getByRole('button', { name: 'Confirm Setup Completed' }))
    expect(fetchMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('checkbox', { name: /enabled two-factor authentication/ }))
    await user.click(screen.getByRole('button', { name: 'Confirm Setup Completed' }))

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard/compliance'))
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://app.styreiq.test/api/compliance_tasks/42/complete-password-setup',
    )
    expect(toast.success).toHaveBeenCalledWith('Password setup confirmed successfully')
  })

  it('should show the overdue banner when the due date has passed', () => {
    render(
      <PasswordSetupForm
        task={buildComplianceTask({ type: 'PASSWORD_SETUP', dueDate: overdue })}
      />,
    )

    expect(screen.getByText(/Overdue - Due date/)).toBeInTheDocument()
  })
})

describe('TrainingForm', () => {
  it('should show the content and start link of the assigned training', () => {
    render(
      <TrainingForm
        task={buildComplianceTask({
          type: 'TRAINING_COMPLETION',
          relatedTraining: 'training-governance',
          description: 'Complete: Social Media Governance Essentials',
          dueDate: upcoming,
        })}
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Social Media Governance Essentials' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/fundamentals of social media governance/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start Training/ })).toHaveAttribute(
      'href',
      '/trainings/governance-essentials/index.html',
    )
  })

  it('should fall back to the risk training when no training is related', () => {
    render(
      <TrainingForm
        task={buildComplianceTask({ type: 'TRAINING_COMPLETION', dueDate: overdue })}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Training' })).toBeInTheDocument()
    expect(screen.getByText(/reduce social media risk/)).toBeInTheDocument()
    expect(screen.getByText(/Overdue - Due date/)).toBeInTheDocument()
  })

  it('should omit the start link for trainings without hosted material', () => {
    render(
      <TrainingForm
        task={buildComplianceTask({
          type: 'TRAINING_COMPLETION',
          relatedTraining: 'training-brand',
        })}
      />,
    )

    expect(screen.queryByRole('link', { name: /Start Training/ })).not.toBeInTheDocument()
  })

  it('should record the training completion once confirmed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <TrainingForm
        task={buildComplianceTask({
          id: 42,
          type: 'TRAINING_COMPLETION',
          relatedTraining: 'training-risk',
        })}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: /completed this training/ }))
    await user.click(screen.getByRole('button', { name: 'Mark Training as Completed' }))

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard/compliance'))
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://app.styreiq.test/api/compliance_tasks/42/complete-training',
    )
    expect(toast.success).toHaveBeenCalledWith('Training completed successfully')
  })
})
