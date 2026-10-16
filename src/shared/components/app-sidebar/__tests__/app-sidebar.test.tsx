import '../../__tests__/dom-polyfills'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppSidebar } from '../index'
import { mainNavigation } from '../nav-config'
import { SidebarProvider } from '../../ui/sidebar'
import { buildOrganization, buildUser } from '../../../__tests__/fixtures'
import type { Tenant } from '@/types/payload-types'
import { buildTenant } from '../../__tests__/component-fixtures'

const navigation = vi.hoisted(() => ({ pathname: '/dashboard' }))
vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}))

const tenant: Tenant = buildTenant()

function renderSidebar(user = buildUser(), sidebarTenant: Tenant | null = null) {
  return render(
    <SidebarProvider>
      <AppSidebar user={user} tenant={sidebarTenant} />
    </SidebarProvider>,
  )
}

const unitAdmin = buildUser({
  roles: ['unit_admin'],
  organizations: [buildOrganization()],
})

describe('mainNavigation', () => {
  it('should have unique titles and urls under /dashboard', () => {
    const titles = mainNavigation.map((item) => item.title)
    expect(new Set(titles).size).toBe(titles.length)
    expect(mainNavigation.every((item) => item.url.startsWith('/dashboard'))).toBe(true)
  })
})

describe('AppSidebar', () => {
  const originalLocation = window.location
  const replace = vi.fn()

  beforeEach(() => {
    navigation.pathname = '/dashboard'
    window.innerWidth = 1280
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    })
  })
  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    replace.mockClear()
  })

  it('should show the signed-in role and email', () => {
    renderSidebar(unitAdmin)
    const account = screen.getByRole('region', { name: 'Signed-in account' })
    expect(within(account).getByText('Unit Admin')).toBeInTheDocument()
    expect(within(account).getByText(unitAdmin.email)).toBeInTheDocument()
  })

  it('should only list the navigation items the role may read', () => {
    renderSidebar(
      buildUser({ roles: ['social_media_manager'], organizations: [buildOrganization()] }),
    )
    const nav = screen.getByRole('navigation', { name: 'Dashboard primary' })
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Tenants' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Audit Log' })).not.toBeInTheDocument()
  })

  it('should mark the current page and its nested routes as active', () => {
    navigation.pathname = '/dashboard/units/42'
    renderSidebar(unitAdmin)
    expect(screen.getByRole('link', { name: 'Units' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('should only mark Dashboard active on the exact dashboard route', () => {
    navigation.pathname = '/dashboard'
    renderSidebar(unitAdmin)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  })

  it('should show the tenant card to non super admins', () => {
    renderSidebar(unitAdmin, tenant)
    const card = screen.getByRole('region', { name: 'Current organization' })
    expect(within(card).getByText('Universidad Andina')).toBeInTheDocument()
    expect(within(card).getByText('universidad-andina.edu')).toBeInTheDocument()
  })

  it('should offer the role switcher only to users with several roles', () => {
    renderSidebar(
      buildUser({
        roles: ['unit_admin', 'social_media_manager'],
        active_role: 'unit_admin',
        organizations: [buildOrganization()],
      }),
    )
    expect(screen.getByRole('combobox', { name: 'Switch role' })).toBeInTheDocument()
  })

  it('should not render the role switcher for a single role', () => {
    renderSidebar(unitAdmin)
    expect(screen.queryByRole('combobox', { name: 'Switch role' })).not.toBeInTheDocument()
  })

  it('should start the logout navigation and disable the button once pressed', async () => {
    const user = userEvent.setup()
    renderSidebar(unitAdmin)

    await user.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(replace).toHaveBeenCalledWith('/api/logout')
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeDisabled()
  })
})
