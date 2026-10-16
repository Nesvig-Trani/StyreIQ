import '@/shared/components/__tests__/dom-polyfills'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { buildSocialMedia } from '../fixtures'
import { UpdateSocialMediaForm } from '../../forms/update-social-media'
import { CreateSocialMediaForm } from '../../forms/create-social-media'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  getUsersByOrganizationAndRole: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}))
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }))
vi.mock('@/features/users/plugins/queries', () => ({
  getUsersByOrganizationAndRole: mocks.getUsersByOrganizationAndRole,
}))

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const daniela = buildUser({ id: 1, name: 'Daniela Cárdenas', roles: ['unit_admin'] })
const sebastian = buildUser({
  id: 5,
  name: 'Sebastián Peña',
  email: 'sebastian.pena@universidad-andina.edu',
  roles: ['unit_admin'],
})
const laura = buildUser({
  id: 3,
  name: 'Laura Vélez',
  email: 'laura.velez@universidad-andina.edu',
  roles: ['social_media_manager'],
})
const organizations = [buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })]
const users = [daniela, sebastian, laura]

const account = buildSocialMedia({
  id: 7,
  organization: 100,
  primaryAdmin: 1,
  backupAdmin: 5,
  socialMediaManagers: [3],
  creationDate: '2024-03-15',
  adminContactEmails: [{ email: 'laura.velez@universidad-andina.edu' }],
  thirdPartyManagement: 'no_managed_internally',
  passwordManagementPractice: 'password_manager_shared',
})

const centralAdmin = buildUser({ id: 2, roles: ['central_admin'] })
const unitAdmin = buildUser({ id: 4, roles: ['unit_admin'], organizations: [100] })

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(jsonResponse(200, { id: 7 }))
  mocks.getUsersByOrganizationAndRole.mockResolvedValue({ docs: users })
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const renderUpdateForm = (currentUser = centralAdmin) =>
  render(
    <UpdateSocialMediaForm
      data={account}
      users={users}
      organizations={organizations}
      user={currentUser}
      currentUser={currentUser}
    />,
  )

const waitForUnitUsers = () =>
  waitFor(() => expect(screen.getAllByText('Sebastián Peña').length).toBeGreaterThan(0))

const sentBody = () => JSON.parse(String(fetchMock.mock.calls[0][1]?.body))

describe('UpdateSocialMediaForm', () => {
  it('should prefill the form with the current account data', async () => {
    renderUpdateForm()

    expect(screen.getByLabelText(/Account Name/)).toHaveValue('Universidad Andina Oficial')
    expect(screen.getByLabelText(/Profile URL/)).toHaveValue(
      'https://www.instagram.com/uandina_oficial',
    )
    await waitFor(() =>
      expect(mocks.getUsersByOrganizationAndRole).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 100 }),
      ),
    )
  })

  it('should send an empty backup admin when the user clears it, so it is removed', async () => {
    const user = userEvent.setup()
    renderUpdateForm()
    await waitForUnitUsers()

    await user.click(screen.getAllByRole('button', { name: 'Clear selection' })[0])
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://app.styreiq.test/api/social-medias/7')
    expect(sentBody()).toMatchObject({ id: 7, primaryAdmin: '1', backupAdmin: '' })
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith('Social media account updated successfully'),
    )
    expect(mocks.push).toHaveBeenCalledWith('/dashboard/social-media-accounts')
  })

  it('should keep the backup admin when the user does not touch it', async () => {
    const user = userEvent.setup()
    renderUpdateForm()
    await waitForUnitUsers()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(sentBody().backupAdmin).toBe('5')
  })

  it('should mark the update as pending approval when a unit admin saves', async () => {
    const user = userEvent.setup()
    renderUpdateForm(unitAdmin)
    await waitForUnitUsers()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        'Social media account updated successfully and is pending approval',
      ),
    )
    expect(sentBody().status).toBe('pending')
  })

  it('should show the API error when the update is rejected', async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { error: 'Unit selected is not valid.' }))
    const user = userEvent.setup()
    renderUpdateForm()
    await waitForUnitUsers()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith('Unit selected is not valid.'),
    )
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('should show a generic message when the update fails unexpectedly', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const user = userEvent.setup()
    renderUpdateForm()
    await waitForUnitUsers()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'An error occurred while updating the social media account, please try again',
      ),
    )
  })

  it('should go back to the accounts list when cancelled', async () => {
    const user = userEvent.setup()
    renderUpdateForm()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mocks.push).toHaveBeenCalledWith('/dashboard/social-media-accounts/')
  })
})

describe('CreateSocialMediaForm', () => {
  const renderCreateForm = () =>
    render(
      <CreateSocialMediaForm
        users={users}
        organizations={organizations}
        currentUser={centralAdmin}
        selectedTenantId={10}
      />,
    )

  it('should not load unit users until a unit is selected', () => {
    renderCreateForm()

    expect(screen.getByLabelText(/Account Name/)).toHaveValue('')
    expect(mocks.getUsersByOrganizationAndRole).not.toHaveBeenCalled()
  })

  it('should show field errors instead of calling the API when required fields are empty', async () => {
    const user = userEvent.setup()
    renderCreateForm()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Account name is required')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should go back to the accounts list when cancelled', async () => {
    const user = userEvent.setup()
    renderCreateForm()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mocks.push).toHaveBeenCalledWith('/dashboard/social-media-accounts/')
  })
})
