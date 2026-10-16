import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { CreateFlagForm } from '../../forms/create-flag-form'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { buildSocialMedia, jsonResponse } from '../fixtures'

const unitUsers = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/features/users/plugins/queries', () => ({
  getUsersByOrganizationAndRole: unitUsers.get,
}))

const navigation = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push, refresh: vi.fn() }),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()

beforeAll(() => {
  // jsdom lacks the pointer and scroll APIs Radix selects rely on.
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = () => {}
})

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  unitUsers.get.mockReset()
  navigation.push.mockClear()
  vi.mocked(toast.success).mockClear()
})
afterEach(() => vi.unstubAllGlobals())

const users = [
  buildUser({ id: 42, name: 'Camilo Ortiz' }),
  buildUser({ id: 7, name: 'Valentina Restrepo' }),
]

const renderForm = (
  organizations = [buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })],
) =>
  render(
    <CreateFlagForm
      users={users}
      socialMedias={[buildSocialMedia({ id: 31 })]}
      organizations={organizations}
      selectedTenantId={10}
    />,
  )

const choose = async (
  user: ReturnType<typeof userEvent.setup>,
  field: RegExp | string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: field }))
  await user.click(await screen.findByRole('option', { name: option }))
}

describe('CreateFlagForm', () => {
  it('should only offer manual flag types', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('combobox', { name: /Flag Type/ }))

    const options = (await screen.findAllByRole('option')).map((o) => o.textContent)
    expect(options).toEqual([
      'Security Concern',
      'Operational Issue',
      'Other',
      'Lost / Inaccessible Account',
    ])
  })

  it('should hide account fields until a lost account flag is chosen', async () => {
    const user = userEvent.setup()
    renderForm()
    expect(screen.queryByLabelText(/Account URL/)).not.toBeInTheDocument()

    await choose(user, /Flag Type/, 'Lost / Inaccessible Account')

    expect(await screen.findByLabelText(/Account URL/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Access Issue/)).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Affected Entity Type/ })).not.toBeInTheDocument()
  })

  it('should ask for the affected entity type after choosing an entity flag type', async () => {
    const user = userEvent.setup()
    renderForm()

    await choose(user, /Flag Type/, 'Security Concern')

    expect(
      await screen.findByRole('combobox', { name: /Affected Entity Type/ }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/Account URL/)).not.toBeInTheDocument()
  })

  it('should not submit and show validation messages when required data is missing', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /submit|save|create/i }))

    expect(await screen.findAllByText(/is required|Required|Invalid/i)).not.toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should return to the flags list when cancelled', async () => {
    renderForm()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }))

    expect(navigation.push).toHaveBeenCalledWith('/dashboard/flags')
  })

  it('should submit a lost account flag with the selected tenant and go back to the list', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 55 }))
    const user = userEvent.setup()
    renderForm()

    await choose(user, /Flag Type/, 'Lost / Inaccessible Account')
    await user.click(await screen.findByLabelText(/Account URL/))
    await user.paste('https://instagram.com/uandina_artes')
    await choose(user, /Platform/, 'Instagram')
    await user.click(screen.getByLabelText(/Access Issue/))
    await user.paste('El administrador anterior se fue')
    await choose(user, /Assigned To/, 'Valentina Restrepo')
    await user.click(screen.getByLabelText(/Risk Description/))
    await user.paste('Cuenta inaccesible')
    await user.click(screen.getByLabelText(/Suggested Action/))
    await user.paste('Solicitar recuperación')
    await user.click(screen.getByRole('button', { name: /Due Date|Select due date/ }))
    await user.click(await screen.findByRole('gridcell', { name: /15/ }))
    await user.click(screen.getByRole('button', { name: /submit|save|create/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body).toMatchObject({
      flagType: 'lost_inaccessible_account',
      accountUrl: 'https://instagram.com/uandina_artes',
      accountPlatform: 'instagram',
      assignedTo: '7',
      tenant: 10,
    })
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/dashboard/flags'))
    expect(toast.success).toHaveBeenCalledWith('Risk flag created successfully')
  })

  describe('assignees of a lost account flag', () => {
    const unitMember = buildUser({ id: 99, name: 'Marta Unit Member' })

    it('should list only the members of the selected unit', async () => {
      unitUsers.get.mockResolvedValue({ docs: [unitMember] })
      const user = userEvent.setup()
      renderForm()

      await choose(user, /Flag Type/, 'Lost / Inaccessible Account')
      await choose(user, /Organizational Unit/, 'Dirección de Comunicaciones')
      await user.click(screen.getByRole('combobox', { name: /Assigned To/ }))

      const options = (await screen.findAllByRole('option')).map((o) => o.textContent)
      expect(options).toEqual(['Marta Unit Member'])
      expect(unitUsers.get).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 100,
          roles: expect.arrayContaining(['central_admin', 'unit_admin']),
        }),
      )
    })

    it('should clear the chosen assignee when the unit changes', async () => {
      unitUsers.get.mockResolvedValue({ docs: [unitMember] })
      const user = userEvent.setup()
      renderForm([
        buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' }),
        buildOrganization({ id: 101, name: 'Admisiones' }),
      ])

      await choose(user, /Flag Type/, 'Lost / Inaccessible Account')
      await choose(user, /Organizational Unit/, 'Dirección de Comunicaciones')
      await choose(user, /Assigned To/, 'Marta Unit Member')
      expect(screen.getByRole('combobox', { name: /Assigned To/ })).toHaveTextContent(
        'Marta Unit Member',
      )

      await choose(user, /Organizational Unit/, 'Admisiones')

      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: /Assigned To/ })).not.toHaveTextContent(
          'Marta Unit Member',
        ),
      )
    })

    it('should keep the full user list for other flag types', async () => {
      const user = userEvent.setup()
      renderForm()

      await choose(user, /Flag Type/, 'Other')
      await user.click(screen.getByRole('combobox', { name: /Assigned To/ }))

      const options = (await screen.findAllByRole('option')).map((o) => o.textContent)
      expect(options).toEqual(['Camilo Ortiz', 'Valentina Restrepo'])
      expect(unitUsers.get).not.toHaveBeenCalled()
    })

    it('should say so when the selected unit has no users', async () => {
      unitUsers.get.mockResolvedValue({ docs: [] })
      const user = userEvent.setup()
      renderForm()

      await choose(user, /Flag Type/, 'Lost / Inaccessible Account')
      await choose(user, /Organizational Unit/, 'Dirección de Comunicaciones')
      await user.click(screen.getByRole('combobox', { name: /Assigned To/ }))

      expect(
        await screen.findByText('The selected unit has no users to assign'),
      ).toBeInTheDocument()
    })
  })
})
