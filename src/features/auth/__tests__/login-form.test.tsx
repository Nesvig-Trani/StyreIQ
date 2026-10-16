import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { LoginForm } from '../forms/login-form'
import { LOGOUT_REASONS } from '../utils/logoutReason'

// Only the toast UI and the network are faked; the form, hook and message logic are real.
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { custom: vi.fn(), error: vi.fn(), dismiss: vi.fn() }),
}))

const fetchMock = vi.fn<typeof fetch>()

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const submitCredentials = async () => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'valentina.restrepo@universidad-andina.edu')
  await user.type(screen.getByLabelText('Password'), 'Andina#2026')
  await user.click(screen.getByRole('button', { name: 'Login' }))
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  vi.mocked(toast.custom).mockClear()
  vi.mocked(toast.error).mockClear()
})
afterEach(() => vi.unstubAllGlobals())

describe('LoginForm', () => {
  it('should not show a banner on a normal visit', () => {
    render(<LoginForm />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    [LOGOUT_REASONS.policyRejected, 'You must accept the policies to access the system'],
    [LOGOUT_REASONS.inactive, 'Your account is not active.'],
    [LOGOUT_REASONS.noUnitAccess, 'not assigned to any unit'],
  ])('should explain why the session ended (%s)', (reason, text) => {
    render(<LoginForm logoutReason={reason} />)
    expect(screen.getByRole('alert')).toHaveTextContent(text)
  })

  it('should post the credentials and clear the banner when signing in', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    render(<LoginForm logoutReason={LOGOUT_REASONS.inactive} />)
    await submitCredentials()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/users/login')
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'valentina.restrepo@universidad-andina.edu',
      password: 'Andina#2026',
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should show the invalid-credentials message on 401 (GIQ-93)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { errors: [{ message: 'The email or password provided is incorrect.' }] }),
    )
    render(<LoginForm />)
    await submitCredentials()
    await waitFor(() => expect(toast.custom).toHaveBeenCalledOnce())
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('should show the account-locked message when Payload reports too many attempts', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, {
        errors: [{ message: 'This user is locked due to having too many failed login attempts.' }],
      }),
    )
    render(<LoginForm />)
    await submitCredentials()
    await waitFor(() => expect(toast.custom).toHaveBeenCalledOnce())
  })

  it('should tell the user StyreIQ is unreachable on a server error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, {}))
    render(<LoginForm />)
    await submitCredentials()
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('could not reach StyreIQ')),
    )
  })

  it('should tell the user StyreIQ is unreachable when the network fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<LoginForm />)
    await submitCredentials()
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('could not reach StyreIQ')),
    )
  })
})
