import '@/shared/components/__tests__/dom-polyfills'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildUser } from '@/shared/__tests__/fixtures'
import { buildSocialMedia } from '../fixtures'
import { AccessTab } from '../../components/social-media-details/tabs/access-tab'
import { SecurityTab } from '../../components/social-media-details/tabs/security-tab'
import { TabNavigation } from '../../components/social-media-details/tab-navigation'
import { DialogActions } from '../../components/social-media-details/dialog-actions'
import { RefreshUsersButton } from '../../components/refresh-users-button'
import { TabType } from '../../components/social-media-details'

const daniela = buildUser({
  id: 1,
  name: 'Daniela Cárdenas',
  email: 'daniela.cardenas@universidad-andina.edu',
})
const sebastian = buildUser({ id: 5, name: 'Sebastián Peña' })
const laura = buildUser({ id: 3, name: 'Laura Vélez', email: 'laura.velez@universidad-andina.edu' })

describe('AccessTab', () => {
  it('should list the primary admin, backup admin and managers with their roles', () => {
    render(
      <AccessTab
        socialMedia={buildSocialMedia({
          primaryAdmin: daniela,
          backupAdmin: sebastian,
          socialMediaManagers: [laura],
        })}
      />,
    )

    expect(screen.getByText('Daniela Cárdenas')).toBeInTheDocument()
    expect(screen.getByText('Sebastián Peña')).toBeInTheDocument()
    expect(screen.getByText('Laura Vélez')).toBeInTheDocument()
    expect(screen.getByText('laura.velez@universidad-andina.edu')).toBeInTheDocument()
    expect(screen.getByText('Social Media Manager')).toBeInTheDocument()
  })

  it('should show "Not assigned" when the backup admin was cleared', () => {
    render(
      <AccessTab
        socialMedia={buildSocialMedia({
          primaryAdmin: daniela,
          backupAdmin: null,
          socialMediaManagers: [laura],
        })}
      />,
    )

    expect(screen.getByText('Not assigned')).toBeInTheDocument()
  })

  it('should fall back to "Not assigned" for users that are not populated', () => {
    render(
      <AccessTab socialMedia={buildSocialMedia({ primaryAdmin: 1, socialMediaManagers: [3] })} />,
    )

    expect(screen.getAllByText('Not assigned').length).toBeGreaterThanOrEqual(2)
  })
})

describe('SecurityTab', () => {
  it('should describe externally managed accounts and show the business id', () => {
    render(
      <SecurityTab
        socialMedia={buildSocialMedia({
          thirdPartyManagement: 'yes_managed_externally',
          passwordManagementPractice: 'password_manager_shared',
          verificationStatus: 'verified',
          businessId: 'BM-48213',
        })}
      />,
    )

    expect(screen.getByText('Yes – Managed by external agency/vendor')).toBeInTheDocument()
    expect(screen.getByText('BM-48213')).toBeInTheDocument()
    expect(screen.getByText('verified')).toBeInTheDocument()
  })

  it('should describe internally managed accounts', () => {
    render(
      <SecurityTab
        socialMedia={buildSocialMedia({ thirdPartyManagement: 'no_managed_internally' })}
      />,
    )

    expect(screen.getByText('No – Managed internally')).toBeInTheDocument()
  })

  it('should show "Not specified" when governance data is missing', () => {
    render(<SecurityTab socialMedia={buildSocialMedia()} />)

    expect(screen.getAllByText('Not specified')).toHaveLength(4)
  })
})

describe('TabNavigation', () => {
  it('should notify which tab the user picked', async () => {
    const onTabChange = vi.fn()
    const user = userEvent.setup()
    render(
      <TabNavigation
        activeTab={TabType.OVERVIEW}
        onTabChange={onTabChange}
        tabs={[
          { id: TabType.OVERVIEW, label: 'Overview', active: true },
          { id: TabType.SECURITY, label: 'Security', active: false },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Security' }))

    expect(onTabChange).toHaveBeenCalledWith(TabType.SECURITY)
  })
})

describe('DialogActions', () => {
  it('should offer an edit link to users who can edit the account', () => {
    render(<DialogActions canEdit socialMedia={buildSocialMedia({ id: 7 })} onClose={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Edit Account' })).toHaveAttribute(
      'href',
      '/dashboard/social-media-accounts/update/7',
    )
  })

  it('should hide the edit link from read-only users and close on request', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<DialogActions canEdit={false} socialMedia={buildSocialMedia()} onClose={onClose} />)

    expect(screen.queryByRole('link', { name: 'Edit Account' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('RefreshUsersButton', () => {
  it('should refresh the user list when clicked', async () => {
    const onRefresh = vi.fn()
    const user = userEvent.setup()
    render(<RefreshUsersButton onRefresh={onRefresh} isRefreshing={false} />)

    await user.click(screen.getByRole('button', { name: 'Refresh users list' }))

    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('should be disabled while refreshing', () => {
    render(<RefreshUsersButton onRefresh={vi.fn()} isRefreshing />)

    expect(screen.getByRole('button', { name: 'Refresh users list' })).toBeDisabled()
  })
})
