import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RequestDemoModal } from '../components/request-demo-modal'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

const openModal = async () => {
  const user = userEvent.setup()
  render(<RequestDemoModal trigger={<button>Request a demo</button>} />)
  await user.click(screen.getByRole('button', { name: 'Request a demo' }))
  return user
}

describe('RequestDemoModal', () => {
  it('should open the form from the trigger', async () => {
    await openModal()
    expect(await screen.findByRole('heading', { name: 'Request a Demo' })).toBeInTheDocument()
  })

  it('should not send anything when the required fields are empty', async () => {
    const user = await openModal()
    await user.click(await screen.findByRole('button', { name: /submit|send|request/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should send the request once and show the confirmation (GIQ-90)', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    const user = await openModal()

    await user.type(await screen.findByPlaceholderText('Your full name'), 'Camila Ortiz')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'camila.ortiz@uniandes.edu.co')
    await user.type(screen.getByPlaceholderText('Your organization'), 'Universidad de los Andes')
    await user.click(screen.getByRole('button', { name: /submit|send|request/i }))

    expect(await screen.findByText('Thank you!')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/users/request-demo')
    expect(JSON.parse(String(init?.body))).toMatchObject({
      name: 'Camila Ortiz',
      email: 'camila.ortiz@uniandes.edu.co',
      company: 'Universidad de los Andes',
    })
  })

  it('should disable the submit button while the request is in flight (GIQ-90)', async () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))
    const user = await openModal()

    await user.type(await screen.findByPlaceholderText('Your full name'), 'Camila Ortiz')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'camila.ortiz@uniandes.edu.co')
    const submit = screen.getByRole('button', { name: /submit|send|request/i })
    await user.click(submit)

    await waitFor(() => expect(submit).toBeDisabled())
    await user.click(submit)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('should clear the form when cancelled', async () => {
    const user = await openModal()
    await user.type(await screen.findByPlaceholderText('Your full name'), 'Camila Ortiz')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Request a Demo' })).not.toBeInTheDocument(),
    )
  })
})
