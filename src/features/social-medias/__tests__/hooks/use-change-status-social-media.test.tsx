import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSocialMedia } from '../fixtures'
import { useChangeStatusSocialMedia } from '../../hooks/useChangeStatusSocialMedia'

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: vi.fn() }),
}))
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }))

const fetchMock = vi.fn()
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body)

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(jsonResponse({ message: 'Status updated successfully' }))
})

afterEach(() => {
  fetchMock.mockReset()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const setup = (status: 'pending_approval' | 'active' | 'in_transition' = 'pending_approval') =>
  renderHook(() => useChangeStatusSocialMedia(buildSocialMedia({ id: 7, status })))

const DeactivationHarness = () => {
  const hook = useChangeStatusSocialMedia(buildSocialMedia({ id: 7, status: 'active' }))
  return (
    <div>
      <button onClick={() => hook.onChangeStatus(false)}>Deactivate</button>
      {hook.showDeactivateModal && (
        <>
          <textarea
            aria-label="Reason"
            value={hook.deactivationReason}
            onChange={hook.handleReasonChange}
          />
          <button onClick={hook.handleDeactivateConfirm}>Confirm</button>
          <button onClick={hook.handleDeactivateCancel}>Cancel</button>
        </>
      )}
    </div>
  )
}

describe('useChangeStatusSocialMedia', () => {
  it('should move a pending account to in transition when it is approved', async () => {
    const { result } = setup()

    await act(() => result.current.onClickApproveAccount())

    expect(sentBody()).toMatchObject({ status: 'in_transition' })
    expect(result.current.stateSocialMedia.status).toBe('in_transition')
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Status updated successfully')
    expect(result.current.isLoading).toBe(false)
  })

  it('should activate an account in transition', async () => {
    const { result } = setup('in_transition')

    await act(() => result.current.onClickActivateAccount())

    expect(sentBody()).toMatchObject({ status: 'active' })
    expect(result.current.stateSocialMedia.status).toBe('active')
  })

  it('should show the API error message when approving fails with a known error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'Cannot access social media from different tenant' }, 403),
    )
    const { result } = setup()

    await act(() => result.current.onClickApproveAccount())

    expect(mocks.toastError).toHaveBeenCalledWith(
      'Cannot access social media from different tenant',
    )
    expect(result.current.stateSocialMedia.status).toBe('pending_approval')
  })

  it('should show a generic error when activating fails unexpectedly', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const { result } = setup('in_transition')

    await act(() => result.current.onClickActivateAccount())

    expect(mocks.toastError).toHaveBeenCalledWith(
      'An error occurred while changing the status of the social media account, please try again',
    )
    expect(result.current.stateSocialMedia.status).toBe('in_transition')
  })

  it('should show a generic error when approving fails unexpectedly', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const { result } = setup()

    await act(() => result.current.onClickApproveAccount())

    expect(mocks.toastError).toHaveBeenCalledWith(
      'An error occurred while changing the status of the social media account, please try again',
    )
  })

  it('should show the API error when activating fails with a known error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Status is not valid.' }, 400))
    const { result } = setup('in_transition')

    await act(() => result.current.onClickActivateAccount())

    expect(mocks.toastError).toHaveBeenCalledWith('Status is not valid.')
  })

  it('should open the deactivation dialog instead of calling the API when switching off', async () => {
    const { result } = setup('active')

    await act(() => result.current.onChangeStatus(false))

    expect(result.current.showDeactivateModal).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should activate and refresh the page when switching on', async () => {
    const { result } = setup('in_transition')

    await act(() => result.current.onChangeStatus(true))

    expect(sentBody()).toMatchObject({ status: 'active' })
    expect(mocks.refresh).toHaveBeenCalled()
  })

  it('should show a generic error when switching on fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500))
    const { result } = setup('in_transition')

    await act(() => result.current.onChangeStatus(true))

    expect(mocks.toastError).toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it('should deactivate with the typed reason and close the dialog', async () => {
    const user = userEvent.setup()
    render(<DeactivationHarness />)

    await user.click(screen.getByRole('button', { name: 'Deactivate' }))
    await user.type(screen.getByLabelText('Reason'), 'Cuenta duplicada')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(sentBody()).toEqual({ status: 'inactive', deactivationReason: 'Cuenta duplicada' })
    expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument()
    expect(mocks.refresh).toHaveBeenCalled()
  })

  it('should keep the dialog open and show an error when deactivation fails', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'))
    const { result } = setup('active')

    await act(() => result.current.onChangeStatus(false))
    await act(() => result.current.handleDeactivateConfirm())

    expect(mocks.toastError).toHaveBeenCalled()
    expect(result.current.showDeactivateModal).toBe(true)
  })

  it('should discard the reason and close the dialog when the deactivation is cancelled', async () => {
    const user = userEvent.setup()
    render(<DeactivationHarness />)

    await user.click(screen.getByRole('button', { name: 'Deactivate' }))
    await user.type(screen.getByLabelText('Reason'), 'Ya no se usa')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Deactivate' }))

    expect(screen.getByLabelText('Reason')).toHaveValue('')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
