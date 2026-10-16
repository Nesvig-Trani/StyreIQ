import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { CreateFirstUserForm } from '../../forms/create-first-user'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const fillAndSubmit = async (password = 'Andina#2026') => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Name/), 'Camila Ortega')
  await user.type(screen.getByLabelText(/Email/), 'camila.ortega@universidad-andina.edu')
  await user.type(screen.getByLabelText(/Password/), password)
  await user.click(screen.getByRole('button', { name: 'Create user' }))
}

beforeEach(() => {
  push.mockReset()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('CreateFirstUserForm', () => {
  it('should create the first user and redirect to login', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))
    render(<CreateFirstUserForm />)
    await fillAndSubmit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/create-first-user')
    expect(JSON.parse(String(init?.body))).toEqual({
      name: 'Camila Ortega',
      email: 'camila.ortega@universidad-andina.edu',
      password: 'Andina#2026',
    })
    expect(toast.success).toHaveBeenCalledWith('User created successfully')
  })

  it('should not submit a password shorter than 8 characters', async () => {
    render(<CreateFirstUserForm />)
    await fillAndSubmit('corta')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create user' })).toBeEnabled())
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should show an error toast when the API rejects the request', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: 'User already exists' }))
    render(<CreateFirstUserForm />)
    await fillAndSubmit()

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(push).not.toHaveBeenCalled()
  })
})
