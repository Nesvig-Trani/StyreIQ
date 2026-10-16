import '../../__tests__/dom-polyfills'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '../sidebar'
import { TooltipProvider } from '../tooltip'

function setViewportWidth(width: number): void {
  window.innerWidth = width
}

function Navigation({ collapsible }: { collapsible?: 'offcanvas' | 'icon' | 'none' }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible={collapsible}>
        <SidebarHeader>Universidad Andina</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Gestión</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>Comunicaciones</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>Cerrar sesión</SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <p>Contenido principal</p>
      </SidebarInset>
    </SidebarProvider>
  )
}

function StateProbe() {
  const { state, open } = useSidebar()
  return (
    <p>
      {state}-{String(open)}
    </p>
  )
}

describe('Sidebar (desktop)', () => {
  const originalWidth = window.innerWidth
  beforeEach(() => {
    setViewportWidth(1280)
    document.cookie = 'sidebar_state=; max-age=0'
  })
  afterEach(() => setViewportWidth(originalWidth))

  it('should render its sections and mark the active menu button', () => {
    render(<Navigation />)
    expect(screen.getByText('Universidad Andina')).toBeInTheDocument()
    expect(screen.getByText('Gestión')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comunicaciones' })).toHaveAttribute(
      'data-active',
      'true',
    )
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
  })

  it('should collapse and expand from the trigger and persist the choice in a cookie', async () => {
    const user = userEvent.setup()
    render(
      <SidebarProvider>
        <StateProbe />
        <SidebarTrigger />
      </SidebarProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' })
    expect(screen.getByText('expanded-true')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.click(trigger)
    expect(screen.getByText('collapsed-false')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(document.cookie).toContain('sidebar_state=false')

    await user.click(trigger)
    expect(screen.getByText('expanded-true')).toBeInTheDocument()
    expect(document.cookie).toContain('sidebar_state=true')
  })

  it('should toggle with the Ctrl+B keyboard shortcut', async () => {
    const user = userEvent.setup()
    render(
      <SidebarProvider>
        <StateProbe />
      </SidebarProvider>,
    )
    await user.keyboard('{Control>}b{/Control}')
    expect(screen.getByText('collapsed-false')).toBeInTheDocument()
    await user.keyboard('b')
    expect(screen.getByText('collapsed-false')).toBeInTheDocument()
  })

  it('should toggle from the rail', async () => {
    const user = userEvent.setup()
    render(
      <SidebarProvider>
        <StateProbe />
        <Sidebar>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
    expect(screen.getByText('collapsed-false')).toBeInTheDocument()
  })

  it('should report changes to a controlled provider without changing its own state', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <SidebarProvider open onOpenChange={onOpenChange}>
        <StateProbe />
        <SidebarTrigger />
      </SidebarProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByText('expanded-true')).toBeInTheDocument()
  })

  it('should honour defaultOpen=false', () => {
    render(
      <SidebarProvider defaultOpen={false}>
        <StateProbe />
      </SidebarProvider>,
    )
    expect(screen.getByText('collapsed-false')).toBeInTheDocument()
  })

  it('should render a static sidebar when collapsible is none', () => {
    render(<Navigation collapsible="none" />)
    expect(screen.getByText('Universidad Andina')).toBeInTheDocument()
  })

  it('should call the trigger onClick handler too', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <SidebarProvider>
        <SidebarTrigger onClick={onClick} />
      </SidebarProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should show a tooltip on menu buttons when a tooltip is provided', async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <Sidebar collapsible="icon">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Unidades">Unidades</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      </TooltipProvider>,
    )
    await user.hover(screen.getByRole('button', { name: 'Unidades' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Unidades')
  })

  it('should render the secondary building blocks', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarInput placeholder="Buscar unidad" />
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupAction aria-label="Agregar unidad">+</SidebarGroupAction>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Comunicaciones</SidebarMenuButton>
                <SidebarMenuAction aria-label="Más acciones">...</SidebarMenuAction>
                <SidebarMenuBadge>3</SidebarMenuBadge>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="/dashboard/units" isActive size="sm">
                      Unidades
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenu>
          </SidebarGroup>
        </Sidebar>
      </SidebarProvider>,
    )
    expect(screen.getByPlaceholderText('Buscar unidad')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar unidad' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Más acciones' })).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Unidades' })).toHaveAttribute('data-active', 'true')
    expect(document.querySelector('[data-sidebar="menu-skeleton-icon"]')).toBeInTheDocument()
  })

  it('should throw when useSidebar is used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<StateProbe />)).toThrow(
      'useSidebar must be used within a SidebarProvider.',
    )
    spy.mockRestore()
  })
})

describe('Sidebar (mobile)', () => {
  const originalWidth = window.innerWidth
  beforeEach(() => setViewportWidth(500))
  afterEach(() => setViewportWidth(originalWidth))

  it('should open the sidebar as a sheet from the trigger and close it with the close button', async () => {
    const user = userEvent.setup()
    render(<Navigation />)

    expect(screen.queryByText('Universidad Andina')).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' })
    expect(trigger).toHaveAttribute('aria-controls', 'mobile-sidebar-content')

    await user.click(trigger)
    expect(await screen.findByText('Universidad Andina')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close sidebar' }))
    expect(screen.queryByText('Universidad Andina')).not.toBeInTheDocument()
  })

  it('should return focus to the trigger after the sheet closes', async () => {
    const user = userEvent.setup()
    render(<Navigation />)
    const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' })
    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await vi.waitFor(() => expect(trigger).toHaveFocus())
  })
})
