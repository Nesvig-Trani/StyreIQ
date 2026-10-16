import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewSocialMedia } from '../../components/view-social-media'
import { buildSocialMedia } from '../fixtures'
import type { SocialMedia } from '@/types/payload-types'

const openDialog = async (account: SocialMedia) => {
  render(<ViewSocialMedia account={account} />)
  await userEvent.setup().click(screen.getByRole('button', { name: /View Account/ }))
  return screen.getByRole('dialog')
}

describe('ViewSocialMedia', () => {
  it('should show the account identity and link to the profile', async () => {
    const dialog = await openDialog(buildSocialMedia())

    expect(dialog).toHaveTextContent('Facultad de Artes - Instagram')
    expect(dialog).toHaveTextContent('instagram')
    const link = screen.getByRole('link', { name: /instagram.com\/uandina_artes/ })
    expect(link).toHaveAttribute('href', 'https://instagram.com/uandina_artes')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should fall back to "Not provided" when contact details are missing', async () => {
    const dialog = await openDialog(buildSocialMedia({ contactEmail: null, contactPhone: null }))

    expect(dialog.textContent?.match(/Not provided/g)).toHaveLength(2)
  })

  it('should show the contact details when present', async () => {
    const dialog = await openDialog(
      buildSocialMedia({
        contactEmail: 'comunicaciones@universidad-andina.edu',
        contactPhone: '+57 601 555 0142',
      }),
    )

    expect(dialog).toHaveTextContent('comunicaciones@universidad-andina.edu')
    expect(dialog).toHaveTextContent('+57 601 555 0142')
  })

  it('should warn about inactivity and explain the deactivation reason', async () => {
    const dialog = await openDialog(
      buildSocialMedia({
        inactiveFlag: true,
        deactivationReason: 'Sin publicaciones desde agosto',
      }),
    )

    expect(dialog).toHaveTextContent('Inactive Account Warning')
    expect(dialog).toHaveTextContent('no public activity for 30+ days')
    expect(dialog).toHaveTextContent('Reason: Sin publicaciones desde agosto')
  })

  it('should not warn about inactivity for active accounts', async () => {
    const dialog = await openDialog(buildSocialMedia({ inactiveFlag: false }))

    expect(dialog).not.toHaveTextContent('Inactive Account Warning')
  })
})
