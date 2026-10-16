import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { FlagHistoryModal } from '../../components/flag-history'
import { buildUser } from '@/shared/__tests__/fixtures'
import { buildFlagHistory, jsonResponse } from '../fixtures'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  vi.mocked(toast.error).mockClear()
})
afterEach(() => vi.unstubAllGlobals())

const openHistory = async () => {
  render(<FlagHistoryModal flagId={55} triggerAriaLabel="View flag history for flag #55" />)
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'View flag history for flag #55' }))
}

describe('FlagHistoryModal', () => {
  it('should not request the history until the modal is opened', () => {
    render(<FlagHistoryModal flagId={55} />)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should request the history of the flag sorted by creation when opened', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { docs: [] }))
    await openHistory()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(
      'https://app.styreiq.test/api/flagHistory?where[flag][equals]=55&sort=createdAt',
    )
    expect(init?.credentials).toBe('include')
    expect(await screen.findByText('No history recorded.')).toBeInTheDocument()
  })

  it('should list who did what, including status transitions', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        docs: [
          buildFlagHistory({
            id: 1,
            action: 'created',
            user: buildUser({ name: 'Valentina Restrepo' }),
          }),
          buildFlagHistory({
            id: 2,
            action: 'status_changed',
            prevStatus: 'pending',
            newStatus: 'resolved',
            user: buildUser({ name: 'Mateo Giraldo' }),
          }),
          buildFlagHistory({ id: 3, action: 'comment', user: buildUser({ name: 'Camilo Ortiz' }) }),
        ],
      }),
    )
    await openHistory()

    expect(await screen.findByText('Valentina Restrepo')).toBeInTheDocument()
    expect(screen.getByText('Created risk flag')).toBeInTheDocument()
    expect(screen.getByText('Mateo Giraldo')).toBeInTheDocument()
    expect(screen.getByText(/Changed status from/)).toHaveTextContent(
      'Changed status from Pending to Resolved',
    )
    expect(screen.getByText('Added observation')).toBeInTheDocument()
  })

  it('should tell the user when the history cannot be loaded', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await openHistory()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred loading history, please try again later',
      ),
    )
    expect(screen.getByText('No history recorded.')).toBeInTheDocument()
  })
})
