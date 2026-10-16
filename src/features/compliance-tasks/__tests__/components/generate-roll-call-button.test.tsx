import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { GenerateRollCallButton } from '../../components/generate-roll-call-button'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  router.refresh.mockClear()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})
afterEach(() => vi.unstubAllGlobals())

describe('GenerateRollCallButton', () => {
  it('should post the user and tenant, notify and refresh the page on success', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true })))
    const user = userEvent.setup()
    render(<GenerateRollCallButton userId={7} tenantId={10} userName="Mateo Salazar" />)

    await user.click(screen.getByRole('button', { name: 'Generate Roll Call' }))

    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://app.styreiq.test/api/compliance_tasks/generate-roll-call')
    expect(JSON.parse(String(init?.body))).toEqual({ userId: 7, tenantId: 10 })
    expect(toast.success).toHaveBeenCalledWith('Roll Call Generated', {
      description: 'Roll Call task has been created for Mateo Salazar',
    })
  })

  it('should show the API error message when generation fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'User 7 already has a pending Roll Call task' }), {
        status: 500,
      }),
    )
    const user = userEvent.setup()
    render(<GenerateRollCallButton userId={7} tenantId={10} userName="Mateo Salazar" />)

    await user.click(screen.getByRole('button', { name: 'Generate Roll Call' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Error', {
        description: 'User 7 already has a pending Roll Call task',
      }),
    )
    expect(router.refresh).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Generate Roll Call' })).toBeEnabled()
  })

  it('should disable the button and show progress while the request is running', async () => {
    let finish: (response: Response) => void = () => {}
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (finish = resolve)))
    const user = userEvent.setup()
    render(<GenerateRollCallButton userId={7} tenantId={10} userName="Mateo Salazar" />)

    await user.click(screen.getByRole('button', { name: 'Generate Roll Call' }))

    expect(screen.getByRole('button', { name: 'Generating...' })).toBeDisabled()
    finish(new Response(JSON.stringify({ success: true })))
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
  })

  it('should render an icon-only button labelled with the user name', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true })))
    const user = userEvent.setup()
    render(
      <GenerateRollCallButton userId={7} tenantId={10} userName="Mateo Salazar" variant="icon" />,
    )

    const button = screen.getByRole('button', { name: 'Generate Roll Call for Mateo Salazar' })
    await user.click(button)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  })
})
