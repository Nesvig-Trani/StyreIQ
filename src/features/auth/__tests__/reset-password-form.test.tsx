import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { ResetPasswordForm } from '../forms/reset-password-form'

const push = vi.fn()
const searchParams = vi.hoisted(() => ({ current: new URLSearchParams() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams.current,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const fillPasswords = async (password: string, confirmation: string) => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('New Password'), password)
  await user.type(screen.getByLabelText('Confirm New Password'), confirmation)
  await user.click(screen.getByRole('button', { name: 'Update Password' }))
}

beforeEach(() => {
  push.mockReset()
  fetchMock.mockReset()
  vi.mocked(toast.success).mockReset()
  searchParams.current = new URLSearchParams({ token: 'rst-4f9a2c' })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('ResetPasswordForm', () => {
  it('should redirect to login when the reset link has no token', () => {
    searchParams.current = new URLSearchParams()
    render(<ResetPasswordForm />)
    expect(push).toHaveBeenCalledWith('/login')
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeDisabled()
  })

  it('should reject a password shorter than eight characters', async () => {
    render(<ResetPasswordForm />)
    await fillPasswords('corta', 'corta')
    expect(
      await screen.findByText('Password must be at least 8 characters long'),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should reject mismatched confirmation', async () => {
    render(<ResetPasswordForm />)
    await fillPasswords('Andina#2027', 'Andina#2028')
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should submit the token with the new password and go to the dashboard', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    render(<ResetPasswordForm />)
    await fillPasswords('Andina#2027', 'Andina#2027')

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/users/reset-password')
    expect(JSON.parse(String(init?.body))).toEqual({
      token: 'rst-4f9a2c',
      password: 'Andina#2027',
    })
    expect(toast.success).toHaveBeenCalledWith('Your password has been reset successfully.')
  })

  it('should explain an invalid or expired link and offer a new one', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, {}))
    render(<ResetPasswordForm />)
    await fillPasswords('Andina#2027', 'Andina#2027')

    expect(await screen.findByText('Your reset link is invalid or has expired')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request new token' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
    expect(push).not.toHaveBeenCalledWith('/dashboard')
  })

  it('should send the user back to the login page', async () => {
    render(<ResetPasswordForm />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Back to login/ }))
    expect(push).toHaveBeenCalledWith('/login')
  })
})
