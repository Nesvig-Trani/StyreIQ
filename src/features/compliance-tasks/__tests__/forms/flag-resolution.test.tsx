import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import {
  buildComplianceTask,
  buildFlag,
  buildOrganization,
  buildUser,
} from '@/shared/__tests__/fixtures'
import { buildSocialMedia } from '../fixtures'
import { FlagResolutionForm } from '../../forms/flag-resolution'

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
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ success: true })))
  router.push.mockClear()
  vi.mocked(toast.success).mockClear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const upcoming = new Date(2026, 9, 30, 12).toISOString()
const overdue = new Date(2026, 9, 1, 12).toISOString()

const task = (dueDate = upcoming) =>
  buildComplianceTask({ id: 42, type: 'REVIEW_FLAG', relatedFlag: 300, dueDate })

describe('FlagResolutionForm', () => {
  it('should describe a flag on a social media account with its details', () => {
    const flag = buildFlag({
      id: 300,
      flagType: 'SECURITY_CONCERN',
      description: 'Se detectó un inicio de sesión desde un dispositivo desconocido',
      suggestedAction: 'Restablecer la contraseña y revisar los accesos',
      detectionDate: '2026-10-10T10:00:00.000Z',
      affectedEntity: {
        relationTo: 'social-medias',
        value: buildSocialMedia({ name: 'Admisiones Andina', platform: 'instagram' }),
      },
      createdBy: buildUser({ name: 'Camila Ortega' }),
      assignedTo: buildUser({ name: 'Mateo Salazar' }),
    })

    render(<FlagResolutionForm task={task()} flag={flag} />)

    expect(screen.getByText('Security Concern')).toBeInTheDocument()
    expect(screen.getByText('Social Media Account')).toBeInTheDocument()
    expect(screen.getByText('@Admisiones Andina (instagram)')).toBeInTheDocument()
    expect(screen.getByText('Camila Ortega')).toBeInTheDocument()
    expect(screen.getByText('Mateo Salazar')).toBeInTheDocument()
    expect(screen.getByText(/dispositivo desconocido/)).toBeInTheDocument()
    expect(screen.getByText(/Restablecer la contraseña/)).toBeInTheDocument()
    expect(screen.getByText('10/10/2026')).toBeInTheDocument()
    expect(screen.queryByText('This flag is overdue')).not.toBeInTheDocument()
  })

  it('should describe a flag on an organizational unit', () => {
    const flag = buildFlag({
      flagType: 'OPERATIONAL_ISSUE',
      affectedEntity: {
        relationTo: 'organization',
        value: buildOrganization({ name: 'Dirección de Comunicaciones' }),
      },
    })

    render(<FlagResolutionForm task={task()} flag={flag} />)

    expect(screen.getByText('Organizational Unit')).toBeInTheDocument()
    expect(screen.getByText('Dirección de Comunicaciones')).toBeInTheDocument()
  })

  it('should describe a lost account flag using the reported URL', () => {
    const flag = buildFlag({
      flagType: 'OTHER',
      accountUrl: 'https://tiktok.com/@andina.deportes',
      accountPlatform: 'tiktok',
    })

    render(<FlagResolutionForm task={task()} flag={flag} />)

    expect(screen.getByText('Lost / Inaccessible Account')).toBeInTheDocument()
    expect(screen.getByText(/tiktok.com\/@andina.deportes/)).toBeInTheDocument()
  })

  it('should show unknown when the affected entity is missing or an unsupported type', () => {
    const { unmount } = render(
      <FlagResolutionForm task={task()} flag={buildFlag({ flagType: 'X' })} />,
    )
    expect(screen.getAllByText('Unknown')).toHaveLength(2)
    unmount()

    render(
      <FlagResolutionForm
        task={task()}
        flag={buildFlag({
          flagType: 'X',
          affectedEntity: { relationTo: 'users', value: buildUser() },
        })}
      />,
    )
    expect(screen.getByText('users')).toBeInTheDocument()
  })

  it('should warn when the flag is overdue', () => {
    render(<FlagResolutionForm task={task(overdue)} flag={buildFlag({ flagType: 'OTHER' })} />)

    expect(screen.getByText('This flag is overdue')).toBeInTheDocument()
    expect(screen.getByText(/Overdue - Due date: 10\/1\/2026/)).toBeInTheDocument()
  })

  it('should require a detailed summary and the confirmation before submitting', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<FlagResolutionForm task={task()} flag={buildFlag({ flagType: 'OTHER' })} />)

    await user.type(screen.getByRole('textbox'), 'corto')
    await user.click(screen.getByRole('button', { name: 'Mark as Completed' }))

    expect(
      await screen.findByText('Please provide a detailed resolution summary'),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should send the summary and return to the task list when completed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<FlagResolutionForm task={task()} flag={buildFlag({ flagType: 'OTHER' })} />)

    await user.type(screen.getByRole('textbox'), 'Se rotó la contraseña y se activó 2FA')
    await user.click(screen.getByRole('checkbox', { name: /reviewed this risk flag/ }))
    await user.click(screen.getByRole('button', { name: 'Mark as Completed' }))

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard/compliance'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://app.styreiq.test/api/compliance_tasks/42/complete-flag-resolution')
    expect(JSON.parse(String(init?.body))).toEqual({
      resolutionSummary: 'Se rotó la contraseña y se activó 2FA',
    })
    expect(toast.success).toHaveBeenCalledWith('Risk flag resolved successfully')
  })
})
