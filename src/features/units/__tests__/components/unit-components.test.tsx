import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnitCell } from '@/features/units/components/unit-cell'
import { DisableUnitButton } from '@/features/units/components/disable-unit'
import { UnitDetail } from '@/features/units/components/unit-detail'
import { UnitTable } from '@/features/units/components/unit-table'
import type { UnitWithDepth } from '@/features/units/schemas'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard/units',
  useSearchParams: () => new URLSearchParams(),
}))

const comunicaciones = buildOrganization({ id: 101, name: 'Dirección de Comunicaciones' })
const biblioteca = buildOrganization({ id: 102, name: 'Biblioteca Central' })
const facultad = buildOrganization({ id: 103, name: 'Facultad de Artes' })

describe('UnitCell', () => {
  it('should render all units as badges when they fit', () => {
    render(<UnitCell organizations={[comunicaciones]} />)
    expect(screen.getByText('Dirección de Comunicaciones')).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should ignore units without a name', () => {
    render(<UnitCell organizations={[buildOrganization({ id: 5, name: '' }), biblioteca]} />)
    expect(screen.getByText('Biblioteca Central')).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should collapse extra units into a popover with a contextual accessible label', async () => {
    render(
      <UnitCell
        organizations={[comunicaciones, biblioteca, facultad]}
        expandLabelContext="Valentina Restrepo"
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Show 2 more units for Valentina Restrepo' })
    expect(trigger).toHaveTextContent('+2 more')
    expect(screen.queryByText('All units')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    const popover = await screen.findByText('All units')
    expect(popover).toBeVisible()
    expect(screen.getAllByText('Facultad de Artes')).toHaveLength(1)
  })

  it('should use the singular label for a single hidden unit', () => {
    render(<UnitCell organizations={[comunicaciones, biblioteca]} />)
    expect(screen.getByRole('button', { name: 'Show 1 more unit' })).toBeVisible()
  })
})

describe('DisableUnitButton', () => {
  it('should render nothing without a unit id', () => {
    render(<DisableUnitButton open onConfirmDisable={vi.fn()} handleOpenChange={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should ask for confirmation and run the disable action', async () => {
    const onConfirmDisable = vi.fn().mockResolvedValue(undefined)
    render(
      <DisableUnitButton
        id={101}
        open
        onConfirmDisable={onConfirmDisable}
        handleOpenChange={vi.fn()}
      />,
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Are you sure you want to disable this unit?')).toBeVisible()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Disable Anyway' }))
    expect(onConfirmDisable).toHaveBeenCalledTimes(1)
  })

  it('should close the dialog when cancelled', async () => {
    const handleOpenChange = vi.fn()
    render(
      <DisableUnitButton
        id={101}
        open
        onConfirmDisable={vi.fn()}
        handleOpenChange={handleOpenChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('UnitDetail', () => {
  const rafael = buildUser({
    id: 7,
    name: 'Rafael Mejía',
    email: 'rafael.mejia@universidad-andina.edu',
  })
  const jimena = buildUser({
    id: 9,
    name: 'Jimena Salazar',
    email: 'jimena.salazar@universidad-andina.edu',
  })

  const unit: UnitWithDepth = {
    ...buildOrganization({
      id: 200,
      name: 'Facultad de Artes',
      type: 'school_faculty',
      status: 'active',
      description: 'Programas de música, artes visuales y teatro',
      websiteUrl: 'https://artes.universidad-andina.edu',
    }),
    parentOrg: buildOrganization({ id: 100, name: 'Universidad Andina' }),
    admin: rafael,
    backupAdmins: [jimena],
    children: {
      docs: [buildOrganization({ id: 300, name: 'Departamento de Música', type: 'department' })],
    },
  }

  it('should show the unit details, hierarchy and administrators', () => {
    render(<UnitDetail organization={unit} />)
    expect(screen.getByText('School/Faculty')).toBeVisible()
    expect(screen.getByText('Programas de música, artes visuales y teatro')).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'https://artes.universidad-andina.edu' }),
    ).toHaveAttribute('href', 'https://artes.universidad-andina.edu')
    expect(screen.getByText('Universidad Andina')).toBeVisible()
    expect(screen.getByText('Child Unit (1)')).toBeVisible()
    expect(screen.getByText('Departamento de Música')).toBeVisible()
    expect(screen.getByText('Rafael Mejía')).toBeVisible()
    expect(screen.getByText('rafael.mejia@universidad-andina.edu')).toBeVisible()
    expect(screen.getByText('Backup Admins')).toBeVisible()
    expect(screen.getByText('Jimena Salazar')).toBeVisible()
  })

  it('should warn when the unit has no manager assigned', () => {
    render(
      <UnitDetail
        organization={{
          ...unit,
          admin: null,
          backupAdmins: [],
          children: undefined,
          description: null,
        }}
      />,
    )
    expect(screen.getByText('Not assigned yet')).toBeVisible()
    expect(screen.getByText('Edit this unit to assign a manager.')).toBeVisible()
    expect(screen.queryByText('Backup Admins')).not.toBeInTheDocument()
    expect(screen.queryByText(/Child Unit/)).not.toBeInTheDocument()
  })

  it('should fall back to placeholders for incomplete administrators', () => {
    const nameless = buildUser({ id: 11, name: '', email: '' })
    render(<UnitDetail organization={{ ...unit, admin: nameless, backupAdmins: [nameless] }} />)
    expect(screen.getAllByText('Unknown')).toHaveLength(2)
    expect(screen.getAllByText('No email')).toHaveLength(2)
  })
})

describe('UnitTable', () => {
  it('should list units with their status, parent and admin state', () => {
    const rows = [
      buildOrganization({
        id: 1,
        name: 'Universidad Andina',
        type: 'higher_education_institution',
        status: 'active',
      }),
      buildOrganization({
        id: 2,
        name: 'Facultad de Artes',
        type: 'school_faculty',
        status: 'inactive',
      }),
    ]
    render(
      <UnitTable data={rows} pagination={{ pageSize: 10, pageIndex: 1, total: 2, pageCount: 1 }} />,
    )
    expect(screen.getByText('Universidad Andina')).toBeVisible()
    expect(screen.getByText('Facultad de Artes')).toBeVisible()
    expect(screen.getByText('active')).toBeVisible()
    expect(screen.getByText('inactive')).toBeVisible()
    expect(screen.getAllByText('Not assigned yet')).toHaveLength(2)
  })
})
