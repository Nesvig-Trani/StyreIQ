import '../__tests__/dom-polyfills'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TableSkeleton } from '../table-skeleton'
import { FormSkeleton } from '../form-skeleton'
import { TruncatedValuePopover } from '../truncated-value-popover'
import { InfoCard } from '../ui/info-card'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Switch } from '../ui/switch'

describe('skeletons', () => {
  it('should render a table skeleton with 25 placeholder cells', () => {
    const { container } = render(<TableSkeleton />)
    expect(container.querySelectorAll('.grid > div')).toHaveLength(25)
  })

  it('should render a form skeleton with five field placeholders', () => {
    const { container } = render(<FormSkeleton />)
    expect(container.querySelectorAll('.space-y-6 > div')).toHaveLength(5)
  })
})

describe('TruncatedValuePopover', () => {
  it('should show a dash for empty values', () => {
    render(<TruncatedValuePopover value="   " expandLabel="Show full email" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should show short values as plain text without a disclosure control', () => {
    render(<TruncatedValuePopover value="rafael.mejia@andina.edu" expandLabel="Show full email" />)
    expect(screen.getByText('rafael.mejia@andina.edu')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should reveal the full value of a long text in a popover', async () => {
    const user = userEvent.setup()
    const value =
      'Dirección de Comunicaciones y Relaciones Institucionales de la Universidad Andina'
    render(
      <TruncatedValuePopover
        value={value}
        expandLabel="Show full unit name"
        expandVisibleLabel="Ver más"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Show full unit name' }))

    expect(await screen.findAllByText(value)).toHaveLength(2)
  })
})

describe('InfoCard', () => {
  it('should render the title, content, icon and action', () => {
    render(
      <InfoCard title="Contacto" icon={<svg data-testid="icon" />} action={<button>Editar</button>}>
        <p>Valentina Restrepo</p>
      </InfoCard>,
    )
    expect(screen.getByRole('heading', { name: 'Contacto' })).toBeInTheDocument()
    expect(screen.getByText('Valentina Restrepo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('should omit the icon wrapper and action when not provided', () => {
    render(
      <InfoCard title="Sin acciones">
        <p>Contenido</p>
      </InfoCard>,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('Breadcrumb', () => {
  it('should expose the trail with the current page marked', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Unidades</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByText('Unidades')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('More')).toBeInTheDocument()
  })
})

describe('Tabs', () => {
  it('should switch panels when another tab is chosen', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="units">Listado de unidades</TabsContent>
        <TabsContent value="users">Listado de usuarios</TabsContent>
      </Tabs>,
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Listado de unidades')

    await user.click(screen.getByRole('tab', { name: 'Usuarios' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Listado de usuarios')
    expect(screen.getByRole('tab', { name: 'Usuarios' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('Switch', () => {
  it('should toggle when clicked and call the change handler', async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="Notificaciones" />)
    const toggle = screen.getByRole('switch', { name: 'Notificaciones' })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
  })
})
