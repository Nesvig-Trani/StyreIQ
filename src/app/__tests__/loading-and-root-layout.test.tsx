import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import RootLayout, { metadata } from '@/app/layout'
import AuditLogsLoading from '@/app/(dashboard)/dashboard/audit-logs/loading'
import ComplianceLoading from '@/app/(dashboard)/dashboard/compliance/loading'
import CreateFlagLoading from '@/app/(dashboard)/dashboard/flags/create/loading'
import PoliciesLoading from '@/app/(dashboard)/dashboard/policies/loading'
import ReviewRequestsLoading from '@/app/(dashboard)/dashboard/review-requests/loading'
import RoleRequestLoading from '@/app/(dashboard)/dashboard/role-request/loading'
import CreateSocialMediaLoading from '@/app/(dashboard)/dashboard/social-media-accounts/create/loading'
import SocialMediasLoading from '@/app/(dashboard)/dashboard/social-media-accounts/loading'
import UpdateSocialMediaLoading from '@/app/(dashboard)/dashboard/social-media-accounts/update/[socialMediaId]/loading'
import CreateTenantLoading from '@/app/(dashboard)/dashboard/tenants/create/loading'
import GovernanceSettingsLoading from '@/app/(dashboard)/dashboard/tenants/update-governance-settings/[tenantId]/loading'
import UpdateTenantLoading from '@/app/(dashboard)/dashboard/tenants/update/[tenantId]/loading'
import CreateUnitLoading from '@/app/(dashboard)/dashboard/units/create/loading'
import UnitsLoading from '@/app/(dashboard)/dashboard/units/loading'
import UsersLoading from '@/app/(dashboard)/dashboard/users/loading'
import UpdateUserLoading from '@/app/(dashboard)/dashboard/users/update/[id]/loading'

describe('root layout', () => {
  it('should expose the product metadata', () => {
    expect(metadata.title).toBe('StyreIQ')
    expect(metadata.description).toContain('Social Media Risk Management')
  })

  it('should render the page inside an English document with a skip link', async () => {
    const markup = renderToStaticMarkup(await RootLayout({ children: <p>Contenido</p> }))
    expect(markup).toContain('<html lang="en">')
    expect(markup).toContain('<p>Contenido</p>')
    expect(markup).toMatch(/href="#main-content"/)
  })
})

describe('route loading states', () => {
  it.each([
    ['audit logs', AuditLogsLoading],
    ['compliance tasks', ComplianceLoading],
    ['create flag', CreateFlagLoading],
    ['policies', PoliciesLoading],
    ['review requests', ReviewRequestsLoading],
    ['role requests', RoleRequestLoading],
    ['create social media', CreateSocialMediaLoading],
    ['social media accounts', SocialMediasLoading],
    ['update social media', UpdateSocialMediaLoading],
    ['create tenant', CreateTenantLoading],
    ['governance settings', GovernanceSettingsLoading],
    ['update tenant', UpdateTenantLoading],
    ['create unit', CreateUnitLoading],
    ['units', UnitsLoading],
    ['users', UsersLoading],
    ['update user', UpdateUserLoading],
  ])('should show skeleton placeholders while %s loads', (_name, Loading) => {
    const { container } = render(<Loading />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
