import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { UpdateUnitForm } from '@/features/units/forms/update-unit'
import type { UnitWithDepth } from '@/features/units/schemas'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const fetchMock = vi.fn<typeof fetch>()

const universidad = buildOrganization({ id: 100, name: 'Universidad Andina' })
const rafael = buildUser({ id: 7, name: 'Rafael Mejía' })
const superAdmin = buildUser({ roles: ['super_admin'], tenant: null })
const unitAdmin = buildUser({ roles: ['unit_admin'], tenant: 10, organizations: [200] })

const rootUnit: UnitWithDepth = {
  ...universidad,
  parentOrg: universidad,
  admin: null,
  backupAdmins: undefined,
  children: undefined,
}

const facultad: UnitWithDepth = {
  ...buildOrganization({
    id: 200,
    name: 'Facultad de Artes',
    type: 'school_faculty',
    status: 'active',
    description: 'Programas de música y teatro',
    websiteUrl: 'https://artes.universidad-andina.edu',
  }),
  parentOrg: universidad,
  admin: rafael,
  backupAdmins: [],
  children: {
    docs: [buildOrganization({ id: 300, name: 'Departamento de Música', status: 'active' })],
  },
}

beforeEach(() => {
  fetchMock.mockReset()
  refresh.mockReset()
  vi.mocked(toast.success).mockReset()
  vi.mocked(toast.error).mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

const renderForm = (user: ReturnType<typeof buildUser>, data: UnitWithDepth | null = facultad) =>
  render(<UpdateUnitForm users={[rafael]} organizations={[rootUnit]} data={data} user={user} />)

describe('UpdateUnitForm', () => {
  it('should prefill the current unit data', () => {
    renderForm(superAdmin)
    expect(screen.getByLabelText('Name')).toHaveValue('Facultad de Artes')
    expect(screen.getByLabelText('Website URL')).toHaveValue('https://artes.universidad-andina.edu')
    expect(screen.getByLabelText('Description')).toHaveValue('Programas de música y teatro')
  })

  it('should lock the fields for unit admins when the unit has active children', () => {
    renderForm(unitAdmin)
    expect(screen.getByLabelText('Name')).toBeDisabled()
    expect(screen.getByLabelText('Website URL')).toBeDisabled()
    expect(screen.queryByText('Parent Unit')).not.toBeInTheDocument()
  })

  it('should let super admins edit and pick the parent unit', () => {
    renderForm(superAdmin)
    expect(screen.getByLabelText('Name')).toBeEnabled()
    expect(screen.getByText('Parent Unit')).toBeVisible()
  })

  it('should send the edited unit and refresh the page', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    renderForm(superAdmin)
    const name = screen.getByLabelText('Name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Facultad de Artes y Diseño')
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Unit updated successfully'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://app.styreiq.test/api/organization')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(String(init?.body))).toMatchObject({
      id: 200,
      name: 'Facultad de Artes y Diseño',
      parentOrg: 100,
      admin: 7,
    })
    expect(refresh).toHaveBeenCalled()
  })

  it('should tell the user when saving fails', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 500 }))
    renderForm(superAdmin)
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred while updating the unit, please try again',
      ),
    )
    expect(refresh).not.toHaveBeenCalled()
  })

  it('should restore the original values on reset', async () => {
    renderForm(superAdmin)
    const name = screen.getByLabelText('Name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Otro nombre')
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(name).toHaveValue('Facultad de Artes')
  })

  it('should not call the API when there is no unit to update', async () => {
    renderForm(superAdmin, null)
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
