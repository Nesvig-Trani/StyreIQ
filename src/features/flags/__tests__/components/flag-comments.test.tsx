import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { FlagCommentsModal } from '../../components/flag-comments'
import { buildUser } from '@/shared/__tests__/fixtures'
import { buildFlagComment, jsonResponse } from '../fixtures'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  vi.mocked(toast.error).mockClear()
  vi.mocked(toast.success).mockClear()
})
afterEach(() => vi.unstubAllGlobals())

const openComments = async () => {
  const user = userEvent.setup()
  render(
    <FlagCommentsModal
      flagId={55}
      triggerAriaLabel="View flag comments for flag #55"
      observationTextareaAriaLabel="Add observation for flag #55"
    />,
  )
  await user.click(screen.getByRole('button', { name: 'View flag comments for flag #55' }))
  return user
}

describe('FlagCommentsModal', () => {
  it('should load and show the existing observations when opened', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        docs: [buildFlagComment({ user: buildUser({ name: 'Camilo Ortiz' }) })],
      }),
    )
    await openComments()

    expect(await screen.findByText('Camilo Ortiz')).toBeInTheDocument()
    expect(screen.getByText('Ya contacté al administrador anterior')).toBeInTheDocument()
  })

  it('should show an empty state when there are no comments', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { docs: [] }))
    await openComments()

    expect(await screen.findByText('No comments yet.')).toBeInTheDocument()
  })

  it('should tell the user when the comments cannot be loaded', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await openComments()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred loading comments, please try again later',
      ),
    )
  })

  it('should post the observation, clear the field and reload the comments', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { docs: [] }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 301 }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          docs: [
            buildFlagComment({
              comment: 'Se rotó la contraseña',
              user: buildUser({ name: 'Valentina Restrepo' }),
            }),
          ],
        }),
      )
    const user = await openComments()
    await screen.findByText('No comments yet.')

    const textarea = screen.getByRole('textbox', { name: 'Add observation for flag #55' })
    await user.type(textarea, 'Se rotó la contraseña')
    await user.click(screen.getByRole('button', { name: 'Add observation' }))

    expect(await screen.findByText('Valentina Restrepo')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[1]
    expect(String(url)).toBe('https://app.styreiq.test/api/flagComments')
    expect(JSON.parse(String(init?.body))).toEqual({ flagId: 55, comment: 'Se rotó la contraseña' })
    expect(toast.success).toHaveBeenCalledWith('Observation added successfully')
    expect(textarea).toHaveValue('')
  })

  it('should keep the typed observation and show an error when posting fails', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { docs: [] }))
      .mockResolvedValueOnce(jsonResponse(500, {}))
    const user = await openComments()
    await screen.findByText('No comments yet.')

    const textarea = screen.getByRole('textbox', { name: 'Add observation for flag #55' })
    await user.type(textarea, 'Pendiente de respuesta')
    await user.click(screen.getByRole('button', { name: 'Add observation' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred adding observation, please try again later',
      ),
    )
    expect(textarea).toHaveValue('Pendiente de respuesta')
  })
})
