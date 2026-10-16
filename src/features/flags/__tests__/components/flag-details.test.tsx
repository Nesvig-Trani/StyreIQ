import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlagDetails } from '../../components/flag-details'
import { buildFlag, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import { buildSocialMedia } from '../fixtures'
import type { Flag } from '@/types/payload-types'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('status=pending&page=2'),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const openDetails = async (flag: Flag) => {
  render(<FlagDetails flag={flag} userComplianceTasks={new Map()} />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'View risk flag details' }))
  return screen.getByRole('dialog')
}

describe('FlagDetails', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  const baseFlag = buildFlag({
    flagType: 'security_concern',
    status: 'pending',
    source: 'manual',
    description: 'Contraseña compartida por WhatsApp',
    suggestedAction: 'Rotar la contraseña y activar 2FA',
    organizations: [buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' })],
    detectionDate: '2026-10-10T12:00:00.000Z',
    lastActivity: '2026-10-12T12:00:00.000Z',
  })

  it('should show the flag summary', async () => {
    const dialog = await openDetails(baseFlag)

    expect(dialog).toHaveTextContent('Risk Flag Details')
    expect(dialog).toHaveTextContent('security_concern')
    expect(dialog).toHaveTextContent('pending')
    expect(dialog).toHaveTextContent('Dirección de Comunicaciones')
    expect(dialog).toHaveTextContent('Manually entered')
    expect(dialog).toHaveTextContent('Contraseña compartida por WhatsApp')
    expect(dialog).toHaveTextContent('Rotar la contraseña y activar 2FA')
    expect(dialog).not.toHaveTextContent('Access Issue')
  })

  it('should highlight activity older than 30 days as stale', async () => {
    const lastActivity = '2026-08-01T12:00:00.000Z'
    await openDetails({ ...baseFlag, lastActivity })

    expect(screen.getByText(new Date(lastActivity).toLocaleString()).className).toMatch(
      /destructive/,
    )
  })

  it('should not highlight recent activity', async () => {
    await openDetails(baseFlag)

    expect(
      screen.getByText(new Date('2026-10-12T12:00:00.000Z').toLocaleString()).className,
    ).not.toMatch(/destructive/)
  })

  it('should show the access issue of lost account flags', async () => {
    const dialog = await openDetails(
      buildFlag({
        flagType: 'lost_inaccessible_account',
        accountUrl: 'https://instagram.com/uandina_artes',
        accountPlatform: 'instagram',
        accessIssue: 'El administrador anterior ya no trabaja en la universidad',
        organizations: [],
      }),
    )

    expect(dialog).toHaveTextContent('https://instagram.com/uandina_artes (Instagram)')
    expect(dialog).toHaveTextContent('El administrador anterior ya no trabaja en la universidad')
    expect(dialog).not.toHaveTextContent('Risk Description')
  })

  it('should keep showing the description of lost account flags that already have one', async () => {
    const dialog = await openDetails(
      buildFlag({
        flagType: 'lost_inaccessible_account',
        description: 'Descripción anterior',
        organizations: [],
      }),
    )

    expect(dialog).toHaveTextContent('Risk Description')
    expect(dialog).toHaveTextContent('Descripción anterior')
  })

  it('should offer to view and edit an affected user keeping the current filters', async () => {
    const affected = buildUser({ id: 42, name: 'Camilo Ortiz' })
    const dialog = await openDetails({
      ...baseFlag,
      affectedEntity: { relationTo: 'users', value: affected },
    })

    expect(dialog).toHaveTextContent('Camilo Ortiz')
    expect(screen.getAllByRole('button', { name: /View Account/ })).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Edit Account/ })).toHaveAttribute(
      'href',
      `/dashboard/users/update/42?returnTo=${encodeURIComponent('/dashboard/flags?status=pending&page=2')}`,
    )
  })

  it('should offer to view and edit an affected social media account', async () => {
    const account = buildSocialMedia({ id: 31 })
    await openDetails({
      ...baseFlag,
      affectedEntity: { relationTo: 'social-medias', value: account },
    })

    expect(screen.getByRole('link', { name: /Edit Account/ })).toHaveAttribute(
      'href',
      `/dashboard/social-media-accounts/update/31?returnTo=${encodeURIComponent('/dashboard/flags?status=pending&page=2')}`,
    )
  })

  it('should not offer account actions when the affected entity is only an id', async () => {
    await openDetails({ ...baseFlag, affectedEntity: { relationTo: 'users', value: 42 } })

    expect(screen.queryByRole('link', { name: /Edit Account/ })).not.toBeInTheDocument()
  })
})
