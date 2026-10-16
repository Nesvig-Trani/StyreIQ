import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { buildComplianceTask } from '@/shared/__tests__/fixtures'
import { buildSocialMedia } from '../fixtures'
import { RollCallForm } from '../../forms/roll-call'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 16, 9, 0, 0))
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ success: true })))
  router.push.mockClear()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const task = (dueDate = new Date(2026, 9, 30, 12).toISOString()) =>
  buildComplianceTask({ id: 42, type: 'USER_ROLL_CALL', dueDate })

const accounts = [
  buildSocialMedia({
    id: 1,
    name: 'Admisiones Andina',
    platform: 'instagram',
    accountHandle: 'admisiones.andina',
  }),
  buildSocialMedia({
    id: 2,
    name: 'Deportes Andina',
    platform: 'tiktok',
    accountHandle: null,
    profileUrl: '',
  }),
]

describe('RollCallForm', () => {
  it('should list the assigned accounts with their handle and profile link', () => {
    render(<RollCallForm task={task()} assignedAccounts={accounts} />)

    expect(screen.getByText('Admisiones Andina')).toBeInTheDocument()
    expect(screen.getByText('@admisiones.andina')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Profile' })).toHaveAttribute(
      'href',
      'https://instagram.com/admisiones.andina',
    )
    expect(screen.getByText('Deportes Andina')).toBeInTheDocument()
    expect(
      screen.getByLabelText('The account assignments listed above are accurate'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Due: 10\/30\/2026/)).toBeInTheDocument()
  })

  it('should explain when no accounts are assigned', () => {
    render(<RollCallForm task={task()} />)

    expect(
      screen.getByText('No accounts are currently assigned to you in StyreIQ.'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('I confirm I currently have no assigned accounts listed in StyreIQ'),
    ).toBeInTheDocument()
  })

  it('should flag an overdue roll call', () => {
    render(<RollCallForm task={task(new Date(2026, 9, 1, 12).toISOString())} />)

    expect(screen.getByText(/Overdue - Due date: 10\/1\/2026/)).toBeInTheDocument()
  })

  it('should keep the confirm button disabled until the box is checked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<RollCallForm task={task()} assignedAccounts={accounts} />)
    const confirm = screen.getByRole('button', { name: 'Confirm Role and Accounts' })

    expect(confirm).toBeDisabled()
    await user.click(screen.getByRole('checkbox'))
    expect(confirm).toBeEnabled()
  })

  it('should record the roll call and go back to the task list', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<RollCallForm task={task()} assignedAccounts={accounts} />)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Confirm Role and Accounts' }))

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard/compliance'))
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://app.styreiq.test/api/compliance_tasks/42/complete-roll-call',
    )
    expect(toast.success).toHaveBeenCalledWith('Roll call confirmed successfully')
  })

  it('should show the server error and re-enable the button when the request fails', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: 'Not authorized to complete this task' }), {
          status: 403,
        }),
    )
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<RollCallForm task={task()} assignedAccounts={accounts} />)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Confirm Role and Accounts' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Not authorized to complete this task'),
    )
    expect(router.push).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Confirm Role and Accounts' })).toBeEnabled()
  })

  it('should return to the task list when cancelling', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<RollCallForm task={task()} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(router.push).toHaveBeenCalledWith('/dashboard/compliance')
  })
})
