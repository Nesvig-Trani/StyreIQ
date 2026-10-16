import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import WelcomeEmailModal from '../../components/welcome-email-modal'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const template = {
  instructions: 'Revise el manual de marca de la Universidad Andina.',
  responsibilities: [{ responsibility: 'Publicar solo contenido aprobado' }],
  policyLinks: [
    { id: 'p1', title: 'Política de redes', url: 'https://universidad-andina.edu/politicas/redes' },
  ],
}

const openModal = async (email = template) => {
  const user = userEvent.setup()
  render(<WelcomeEmailModal email={email} />)
  await user.click(screen.getByRole('button', { name: 'Welcome Email' }))
  return { user, dialog: await screen.findByRole('dialog') }
}

beforeEach(() => {
  refresh.mockReset()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('WelcomeEmailModal', () => {
  it('should preview the current instructions, responsibilities and policy links', async () => {
    const { dialog } = await openModal()
    expect(within(dialog).getByText('Edit User Welcome Email Template')).toBeInTheDocument()
    expect(within(dialog).getAllByText(template.instructions).length).toBeGreaterThan(0)
    expect(within(dialog).getByText('Publicar solo contenido aprobado')).toBeInTheDocument()
    expect(within(dialog).getByText('Política de redes')).toBeInTheDocument()
  })

  it('should explain that default responsibilities apply when the list is empty', async () => {
    const { dialog } = await openModal({ ...template, responsibilities: [] })
    expect(
      within(dialog).getByText(/the email shows the StyreIQ default responsibilities/),
    ).toBeInTheDocument()
  })

  it('should update the preview as the instructions are edited', async () => {
    const { user, dialog } = await openModal()
    const textarea = within(dialog).getByLabelText('Instructions for New Users')
    await user.clear(textarea)
    await user.click(textarea)
    await user.paste('Complete la capacitación de accesibilidad')
    expect(textarea).toHaveValue('Complete la capacitación de accesibilidad')
    expect(
      within(dialog).getAllByText('Complete la capacitación de accesibilidad').length,
    ).toBeGreaterThan(1)
  })

  it('should add and remove responsibilities', async () => {
    const { user, dialog } = await openModal()
    await user.click(within(dialog).getByRole('tab', { name: 'Responsibilities' }))
    const input = within(dialog).getByPlaceholderText('Add new responsibility...')
    await user.click(input)
    await user.paste('  Responder solicitudes de gobernanza  ')
    await user.keyboard('{Enter}')

    expect(
      within(dialog).getAllByText('Responder solicitudes de gobernanza').length,
    ).toBeGreaterThan(0)
    expect(input).toHaveValue('')

    const row = within(dialog).getAllByText('Publicar solo contenido aprobado')
    const removable = row[row.length - 1].closest('div')
    if (!removable) throw new Error('responsibility row not found')
    await user.click(within(removable).getByRole('button'))
    expect(within(dialog).queryByText('Publicar solo contenido aprobado')).not.toBeInTheDocument()
  })

  it('should ignore blank responsibilities', async () => {
    const { user, dialog } = await openModal()
    await user.click(within(dialog).getByRole('tab', { name: 'Responsibilities' }))
    await user.click(within(dialog).getByPlaceholderText('Add new responsibility...'))
    await user.paste('   ')
    await user.keyboard('{Enter}')
    expect(within(dialog).getAllByText('Publicar solo contenido aprobado').length).toBeGreaterThan(
      0,
    )
    expect(within(dialog).getAllByText('Publicar solo contenido aprobado')).toHaveLength(2)
  })

  it('should add, edit and remove policy links', async () => {
    const { user, dialog } = await openModal()
    await user.click(within(dialog).getByRole('tab', { name: 'Policies' }))

    await user.click(within(dialog).getByPlaceholderText('Policy/Training title...'))
    await user.paste('Guía de marca')
    await user.click(within(dialog).getAllByPlaceholderText('URL...')[0])
    await user.paste('https://universidad-andina.edu/marca')
    await user.keyboard('{Enter}')
    expect(within(dialog).getAllByText('Guía de marca').length).toBeGreaterThan(0)

    const titleInput = within(dialog).getByDisplayValue('Política de redes')
    await user.click(titleInput)
    await user.paste(' 2026')
    expect(within(dialog).getByDisplayValue('Política de redes 2026')).toBeInTheDocument()

    const container = titleInput.closest('div')
    if (!container) throw new Error('policy row not found')
    await user.click(within(container).getByRole('button'))
    expect(within(dialog).queryByDisplayValue('Política de redes 2026')).not.toBeInTheDocument()
  })

  it('should save the template, close the dialog and refresh the page', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 1 }))
    const { user, dialog } = await openModal()
    await user.click(within(dialog).getByRole('button', { name: 'Save Template' }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Welcome email updated successfully'),
    )
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://app.styreiq.test/api/welcome-emails')
    expect(JSON.parse(String(init?.body))).toEqual({
      instructions: template.instructions,
      responsibilities: [{ responsibility: 'Publicar solo contenido aprobado' }],
      policyLinks: [{ title: 'Política de redes', url: template.policyLinks[0].url }],
    })
    expect(refresh).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('should keep the dialog open and show an error when saving fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { message: 'boom' }))
    const { user, dialog } = await openModal()
    await user.click(within(dialog).getByRole('button', { name: 'Save Template' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred while updating welcome email, please try again',
      ),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('should discard unsaved edits when cancelled', async () => {
    const { user, dialog } = await openModal()
    const textarea = within(dialog).getByLabelText('Instructions for New Users')
    await user.click(textarea)
    await user.paste(' Texto descartado')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Welcome Email' }))
    expect(await screen.findByLabelText('Instructions for New Users')).toHaveValue(
      template.instructions,
    )
  })
})
