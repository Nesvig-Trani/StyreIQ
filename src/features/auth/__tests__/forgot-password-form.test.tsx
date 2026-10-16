import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordForm } from '../forms/forgot-password-form'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const requestLink = async (email = 'valentina.restrepo@universidad-andina.edu') => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email address'), email)
  await user.click(screen.getByRole('button', { name: 'Send reset link' }))
}

beforeEach(() => {
  push.mockReset()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('ForgotPasswordForm', () => {
  it('should ask for the email address before anything is sent', () => {
    render(<ForgotPasswordForm />)
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should request the reset link and confirm the destination address', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { message: 'ok' }))
    render(<ForgotPasswordForm />)
    await requestLink()

    await waitFor(() =>
      expect(screen.getByText('Check your email for a password reset link')).toBeInTheDocument(),
    )
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/users/forgot-password')
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'valentina.restrepo@universidad-andina.edu',
    })
    expect(screen.getByText('valentina.restrepo@universidad-andina.edu')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send reset link' })).not.toBeInTheDocument()
  })

  it('should show an error and keep the form when the request fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    render(<ForgotPasswordForm />)
    await requestLink()

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled()
    consoleError.mockRestore()
  })

  it('should send the user back to the login page', async () => {
    render(<ForgotPasswordForm />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Back to login/ }))
    expect(push).toHaveBeenCalledWith('/login')
  })
})
