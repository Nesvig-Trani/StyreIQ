import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TenantBadge } from '@/app/(dashboard)/tenant-badge'
import { UserRolesEnum } from '@/features/users'
import { buildTenant } from '../app-fixtures'

describe('TenantBadge', () => {
  it('should tell a super admin they are viewing all tenants', () => {
    render(<TenantBadge tenant={null} isViewingAllTenants userRole={UserRolesEnum.SuperAdmin} />)
    expect(screen.getByText('All Tenants')).toBeInTheDocument()
  })

  it('should show the tenant name when a tenant is selected', () => {
    render(
      <TenantBadge
        tenant={buildTenant({ name: 'Universidad Andina' })}
        isViewingAllTenants={false}
        userRole={UserRolesEnum.SuperAdmin}
      />,
    )
    expect(screen.getByText('Universidad Andina')).toBeInTheDocument()
    expect(screen.queryByText('All Tenants')).not.toBeInTheDocument()
  })

  it('should show the own tenant to a non super admin even if flagged as all tenants', () => {
    render(
      <TenantBadge
        tenant={buildTenant({ name: 'Universidad del Caribe' })}
        isViewingAllTenants
        userRole={UserRolesEnum.UnitAdmin}
      />,
    )
    expect(screen.getByText('Universidad del Caribe')).toBeInTheDocument()
  })

  it('should render nothing without a tenant', () => {
    const { container } = render(
      <TenantBadge tenant={null} userRole={UserRolesEnum.SocialMediaManager} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
